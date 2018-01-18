'use strict'

const AuthPlus = require('../lib')
const injector = require('moh-mongo-injector')
const mongoose = require('mongoose')
const Promise = require('bluebird')
const uuidv4 = require('uuid/v4')
var { DateTime } = require('luxon')

const source = require('./source')

mongoose.Promise = Promise

require('./models/user')(mongoose)
require('./models/role')(mongoose)
require('./models/accessToken')(mongoose)

mongoose.connect('mongodb://127.0.0.1/moh-auth-example', {useMongoClient: true})
  .then(() => flashDB())
  .then(() => injector(source, { models: mongoose.models }))
  .then((data) => {
    console.log('>>> inject success with: \n', data)

    let authPlus = AuthPlus({
      tokenTTL: 3600,
      basicAuth: (username, password) => {
        return mongoose.User.findOne({
          username
        }).then(user => {
          if (!user) return new Error('Invalid Username or Password!')

          if (!authPlus.base.isVerified(username, user.salt, user.hashedPassword)) return new Error('Invalid Username or Password!')

          return user
        })
      },
      customLogin: (openId) => {
        return mongoose.User.findOne({
          wechatOpenId: openId
        }).then(user => {
          if (!user) return new Error('Invalid Username or Password!')

          return user
        })
      },
      fetchInfo: (user) => {
        return mongoose.Role.findOne({
          user: user.id
        }).then(role => {
          if (role) return role

          return {}
        })
      },
      createdToken: (user, info) => {
        return mongoose.AccessToken.create({
          accessToken: uuidv4(),
          accessTokenExpiresAt: DateTime.local().plus({day: 1}),
          refreshToken: uuidv4(),
          refreshTokenExpiresAt: DateTime.local().plus({day: 3}),
          user,
          info
        }).then(token => {
          if (!token) return new Error('Failed to create token.')

          return {
            accessToken: token.accessToken,
            accessTokenExpiresAt: (new Date(token.accessTokenExpiresAt)).getMilliseconds() - (new Date()).getMilliseconds(),
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: (new Date(token.refreshTokenExpiresAt)).getMilliseconds() - (new Date()).getMilliseconds()
          }
        })
      },
      authByToken: (token) => {
        return mongoose.AccessToken.findOne({
          accessToken: token
        }).then(toke  => {
          if (!token) return new Error('Invalid AccessToken!')

          if (new Date(token.accessTokenExpiresAt) < new Date()) return new Error('Token has expired, please refresh')

          return token
        })
      },
      refreshToken: (refreshToken) => {
        return mongoose.AccessToken.findOne({
          refreshToken: refreshToken
        }).then(toke  => {
          if (!token) return new Error('Invalid RefreshToken!')

          if (new Date(token.refreshTokenExpiresAt) < new Date()) return new Error('RefreshToken has expired.')



          return mongoose.AccessToken.create({
          accessToken: uuidv4(),
          accessTokenExpiresAt: DateTime.local().plus({day: 1}),
          refreshToken: uuidv4(),
          refreshTokenExpiresAt: DateTime.local().plus({day: 3}),
          user: toke.user,
          info: toke.info
        }).then(token => {
          if (!token) return new Error('Failed to create token.')

          return {
            accessToken: token.accessToken,
            accessTokenExpiresAt: (new Date(token.accessTokenExpiresAt)).getMilliseconds() - (new Date()).getMilliseconds(),
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: (new Date(token.refreshTokenExpiresAt)).getMilliseconds() - (new Date()).getMilliseconds()
          }
        })
        })
      },
      revokeToken: (token) => {
        return mongoose.AccessToken.deleteOne({
          accessToken: token
        }).then(result => {
          return true
        })
      },
      customRevokeToken: (username) => {
        return mongoose.AccessToken.deleteOne({
          'user.username': username
        }).then(result => {
          return true
        })
      }
    })
  })
.catch(err => console.log)

const flashDB = () => Promise.all(mongoose.modelNames().map(modelName => mongoose.model(modelName).collection.remove()))