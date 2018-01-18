'use strict'

module.exports = (mongoose) => {
  const RoleSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true },
    __v: { type: Number, select: false }
  })

  return mongoose.model('Role', RoleSchema)
}
