'use strict';
const Session = require('./models/session');
const User = require('./models/user');
const Config = require('../config');


const register = function (server, options) {

  server.auth.strategy('session', 'cookie', {
    password: Config.get('/cookieSecret'),
    cookie: 'sid',
    isSecure: false,
    redirectTo: '/login',
    appendNext: 'returnUrl',
    validateFunc: async function (request, data) {

      const session = await Session.findByCredentials(data.session._id, data.session.key);

      if (!session) {
        return { valid: false };
      }

      session.updateLastActive();

      const user = await User.findById(session.userId);

      if (!user) {
        return { valid: false };
      }

      if (!user.isActive) {
        return { valid: false };
      }

      const credentials = {
        session,
        user
      };

      return { credentials, valid: true };
    }
  });
};


module.exports = {
  name: 'auth',
  dependencies: [
    'hapi-auth-cookie',
    'hapi-anchor-model'
  ],
  register
};
