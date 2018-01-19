# moh-auth-plus

The auth plus lib to make auth with role, oauth, custome auth easily and reuseable.

## Usage

User should inject the following methhod to make functions works.

### Inject base methods

* A1 basicAuth: return valied user with `account` and `password` info. `(account, password) => Promise.resolve(user)`

* A2 customAuth: return valied user with `customInfo`. `(customInfo) => Promise.resolve(user)`

* B fetchInfo: return other related info with `user`. `*(user) => Promise.resolve(info)`

* C createdToken: return token with `user` and `info`. `(user, *info) => token`

* D authByToken: return `toekn` withh `accessToken`. `(accessToken) => token`

* E refreshhToken: return new `token` with `refreshToken`. `(refreshToken) => token`

* F1 revokeToken: return boolean with `accessToken`. `(accessToken) => boolean`

* F2 customRevokeToken: return boolean with `userId`. `(info) => boolean` (Use for scenario like admin cancel user access righ.)

### Buildin helpers

* encrypt: return encrypted password. `(password, *salt) => encryptedPassword`

* isVerified: return is password matchh the encrypted password. `(password, encryptedPassword) => boolean`

## Features

* basicLogin: `A1 -> *B -> C`
* customLogin: `A2 -> *B -> C`
* auth: `D`
* refreshhToken: `E`
* logout: `F1`
* forceLogout: `F2`
