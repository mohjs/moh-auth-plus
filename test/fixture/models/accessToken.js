'use strict'

module.exports = (mongoose) => {
  const AccessTokenSchema = new mongoose.Schema({
    accessToken: { type: String, required: true },
    accessTokenExpiresAt: { type: Date, required: true },
    refreshToken: { type: String, required: true },
    refreshTokenExpiresAt: { type: Date, required: true },
    user: { type: Object, required: true },
    info: { type: Object },
  })

  return mongoose.model('AccessToken', AccessTokenSchema)
}
