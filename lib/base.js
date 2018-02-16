'use strict'

const crypto = require('crypto')
const Promise = require('bluebird')

const defaultSalt = 'Phve4usffrqqW26'// Do not use same salt in production

exports.tokenTTL = 7 * 24 * 3600

exports.encrypt = (password, salt=defaultSalt) => {
  const key = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha512')
  return key.toString('hex')
}

exports.isVerified = (password, salt=defaultSalt, encryptedPassword) => {
  const key = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha512')
  return key.toString('hex') === encryptedPassword;
}

exports.basicAuth = (account, password) => new Promise((resolve, reject) => {
  // Return the user object
  resolve()
})

exports.customAuth = (customInfo) => new Promise((resolve, reject) => {
  // Return the user object
  resolve({})
})

exports.fetchInfo = (user) => new Promise((resolve, reject) => {
  // With user object fetch info return the info object
  resolve({})
})

exports.createToken = (user, info) => new Promise((resolve, reject) => {
  // with user and info create a access token
  resolve({})
})

exports.authByToken = (token) => new Promise((resolve, reject) => {
  // Fetch the token and return it
  resolve()
})

exports.refreshToken = (refreshToken) => new Promise((resolve, reject) => {
  // Refresh the Token and return it.
  resolve()
})

exports.revokeToken = (token) => new Promise((resolve, reject) => {
  // Revoke the token
  resolve({})
})

exports.customRevokeToken = (customInfo) => new Promise((resolve, reject) => {
  // Revoke the token of a specific user
  resolve({})
})