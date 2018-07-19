'use strict';
const Config = require('../config');
const Session = require('./models/session');
const User = require('./models/user');


const register = function (server, options) {

  server.auth.strategy('simple', 'basic', {
    validate: async function (request, sessionId, key, h) {

      const session = await Session.findByCredentials(sessionId, key);

      if (!session) {
        return { isValid: false };
      }

      const user = await User.findById(session.userId);

      if (!user) {
        return { isValid: false };
      }

      if (!user.isActive) {
        return { isValid: false };
      }

      const credentials = {
        session,
        user
      };

      return { credentials, isValid: true };
    }
  });


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
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-anchor-model'
  ],
  register
};
