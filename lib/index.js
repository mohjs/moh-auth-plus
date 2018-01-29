'use strict'

const Promise = require('bluebird')
const debug = require('moh-logger').debug('AUTHPLUS')
const { info, warn, error } = require('moh-logger')

const base = require('./base')


let tokenTTL = 7 * 24 * 3600 //s

let basicLogin = (account, password) => {
  let currentUser = null
  return base.basicAuth(account, password)
    .then(user => {
      currentUser = user
      return base.fetchInfo(user)
    })
    .then(info => base.createToken(currentUser, info))
}

let customLogin = (customInfo) => {
  let currentUser = null
  return base.customAuth(customInfo)
    .then(user => {
      currentUser = user
      return base.fetchInfo(user)
    })
    .then(info => base.createToken(currentUser, info))
}
let authenticate = (token) => base.authByToken(token)

let refreshToken = (refreshToken) => base.refreshToken(refreshToken)

let logout = (token) => base.revokeToken(token)

let forceLogout = (customInfo) => base.customRevokeToken(customInfo)

const configPropName = ['tokenTTL',
  'basicAuth', 'customAuth',
  'fetchInfo',
  'createToken',
  'authByToken',
  'refreshToken',
  'revokeToken', 'customRevokeToken']

const injectConfig = (config) => {
  configPropName.forEach(name => {
    base[name] = config[name] || base[name] || (() => Promise.reject('No Implementation'));
  })
}


module.exports = (config) => {
  injectConfig(config)

  // Proxy method.
  return {
    base,
    basicLogin,
    customLogin,
    authenticate,
    refreshToken,
    logout,
    forceLogout
  }
}
