const authPlusInit = require('../lib');

let authPlus = authPlusInit({
  tokenTTL: 3600,
  basicAuth: () => {}
})

console.log('>>> complete');