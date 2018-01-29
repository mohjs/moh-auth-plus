'use strict'

import test from 'ava';

const AuthPlus = require('../lib')
const injector = require('moh-mongo-injector')
const mongoose = require('mongoose')
const Promise = require('bluebird')
const uuidv4 = require('uuid/v4')
var { DateTime } = require('luxon')

const source = require('./fixture/source')
let authPlus = null
let currentToken = null

mongoose.Promise = Promise

require('./fixture/models/user')(mongoose)
require('./fixture/models/role')(mongoose)
require('./fixture/models/accessToken')(mongoose)

const flashDB = () => Promise.all(mongoose.modelNames().map(modelName => mongoose.model(modelName).collection.remove()))

test.before(t => {
	return mongoose.connect('mongodb://127.0.0.1/moh-auth-example')
    .then(() => flashDB())
    .then(() => injector(source, { models: mongoose.models }))
    .then((data) => {
      authPlus = AuthPlus({
        tokenTTL: 3600,
        basicAuth: (username, password) => {
          return mongoose.models.User.findOne({
            username
          }).then(user => {
            if (!user) throw new Error('Invalid Username or Password!')

            if (!authPlus.base.isVerified(password, user.salt, user.hashedPassword)) throw new Error('Invalid Username or Password!')

            return user
          })
        },
        customLogin: (openId) => {
          return mongoose.models.User.findOne({
            wechatOpenId: openId
          }).then(user => {
            if (!user) throw new Error('Invalid Username or Password!')

            return user
          })
        },
        fetchInfo: (user) => {
          return mongoose.models.Role.findOne({
            user: user.id
          }).then(role => {
            if (role) return role

            return {}
          })
        },
        createToken: (user, info) => {
          return mongoose.models.AccessToken.create({
            accessToken: uuidv4(),
            accessTokenExpiresAt: DateTime.local().plus({day: 1}),
            refreshToken: uuidv4(),
            refreshTokenExpiresAt: DateTime.local().plus({day: 3}),
            user,
            info
          }).then(token => {
            if (!token) throw new Error('Failed to create token.')

            const refreshExpire = DateTime.fromISO(token.refreshTokenExpiresAt.toISOString());
            const tokenExpire = DateTime.fromISO(token.accessTokenExpiresAt.toISOString());
            const now = DateTime.local();

            const seconds = tokenExpire.diff(now, 'seconds')

            return {
              accessToken: token.accessToken,
              accessTokenExpiresAt: Math.round(tokenExpire.diff(now, 'seconds').seconds),
              refreshToken: token.refreshToken,
              refreshTokenExpiresAt: Math.round(refreshExpire.diff(now, 'seconds').seconds)
            }
          })
        },
        authByToken: (token) => {
          return mongoose.models.AccessToken.findOne({
            accessToken: token
          }).then(token  => {
            if (!token) throw new Error('Invalid AccessToken!')

            if (new Date(token.accessTokenExpiresAt) < new Date()) throw new Error('Token has expired, please refresh')

            return token
          })
        },
        refreshToken: (refreshToken) => {
          return mongoose.models.AccessToken.findOne({
            refreshToken: refreshToken
          }).then(token  => {
            if (!token) throw new Error('Invalid RefreshToken!')

            if (new Date(token.refreshTokenExpiresAt) < new Date()) throw new Error('RefreshToken has expired.')

            return mongoose.models.AccessToken.create({
            accessToken: uuidv4(),
            accessTokenExpiresAt: DateTime.local().plus({day: 1}),
            refreshToken: uuidv4(),
            refreshTokenExpiresAt: DateTime.local().plus({day: 3}),
            user: token.user,
            info: token.info
          }).then(token => {
            if (!token) throw new Error('Failed to create token.')

            const refreshExpire = DateTime.fromISO(token.refreshTokenExpiresAt.toISOString());
            const tokenExpire = DateTime.fromISO(token.accessTokenExpiresAt.toISOString());
            const now = DateTime.local();

            return {
              accessToken: token.accessToken,
              accessTokenExpiresAt: Math.round(tokenExpire.diff(now, 'seconds').seconds),
              refreshToken: token.refreshToken,
              refreshTokenExpiresAt: Math.round(refreshExpire.diff(now, 'seconds').seconds)
            }
          })
          })
        },
        revokeToken: (token) => {
          return mongoose.models.AccessToken.deleteOne({
            accessToken: token
          }).then(result => {
            return {
              success: true
            }
          })
        },
        customRevokeToken: (username) => {
          return mongoose.models.AccessToken.deleteOne({
            'user.username': username
          }).then(result => {
            return {
              success: true
            }
          })
        }
      })
    })
    .catch(err => console.log)
})

test.serial('should can basic login', async t => {
  t.plan(4)
  
  const token = await authPlus.basicLogin('ole3021', 'test1234')
  currentToken = token

  t.truthy(token.accessToken)
  t.truthy(token.accessTokenExpiresAt)
  t.truthy(token.refreshToken)
  t.truthy(token.refreshTokenExpiresAt)
})

test('should faile with wrong info', async t => {
  try {
    const toke = await authPlus.basicLogin('ole3021', 'wronssg1234')
  } catch (error) {
    t.is(error.message, 'Invalid Username or Password!')
  }
})

test('should can custom login', async t => {
  t.plan(4)

  const token = await authPlus.customLogin('WeChatOpenId')

  t.truthy(token.accessToken)
  t.truthy(token.accessTokenExpiresAt)
  t.truthy(token.refreshToken)
  t.truthy(token.refreshTokenExpiresAt)
})

test.serial('should auth with token', async t => {
  t.plan(4)

  const token = await authPlus.authenticate(currentToken.accessToken)

  t.truthy(token.accessToken)
  t.truthy(token.accessTokenExpiresAt)
  t.truthy(token.refreshToken)
  t.truthy(token.refreshTokenExpiresAt)
})

test('should fail to auth with wrong token', async t => {
  try {
    const token = await authPlus.authenticate('fakeToken')
  } catch (error) {
    t.plan(1)

    t.is(error.message, 'Invalid AccessToken!');
  }
})

test('should refresh token with refreshToken', async t => {
  t.plan(4)

  const token = await authPlus.refreshToken('refreshToken')

  t.truthy(token.accessToken)
  t.truthy(token.accessTokenExpiresAt)
  t.truthy(token.refreshToken)
  t.truthy(token.refreshTokenExpiresAt)
})

test('should fail to refresh token with worng refreshToken', async t => {
  try {
    const token = await authPlus.refreshToken('fakeToken')
  } catch (error) {
    t.plan(1)

    t.is(error.message, 'Invalid RefreshToken!');
  }
})

test('should can log out', async t => {
  t.plan(1)

  const result = await authPlus.logout(currentToken.accessToken)

  t.is(result.success, true)
})

test('should can force log out a user', async t => {
  t.plan(1)

  const result = await authPlus.forceLogout('ole3022')

  t.is(result.success, true);
})

