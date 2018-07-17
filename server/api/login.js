'use strict';
const AuthAttempt = require('../models/auth-attempt');
const Boom = require('boom');
const Joi = require('joi');
const Session = require('../models/session');
const User = require('../models/user');


const register = function (server, serverOptions) {


  server.route({
    method: 'POST',
    path: '/api/login',
    options: {
      auth: false,
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      validate: {
        payload: {
          username: Joi.string().lowercase().required(),
          password: Joi.string().required()
        }
      },
      pre: [{
        assign: 'abuseDetected',
        method: async function (request, h) {

          const ip = request.remoteAddress;
          const username = request.payload.username;
          const detected = await AuthAttempt.abuseDetected(ip, username);

          if (detected) {
            throw Boom.badRequest('Maximum number of auth attempts reached.');
          }

          return h.continue;
        }
      }, {
        assign: 'user',
        method: async function (request, h) {

          const ip = request.remoteAddress;
          const username = request.payload.username;
          const password = request.payload.password;
          const user = await User.findByCredentials(username, password);
          const userAgent = request.headers['user-agent'];

          if (!user) {
            await AuthAttempt.create({ ip, username, userAgent });

            throw Boom.badRequest('Credentials are invalid or account is inactive.');
          }

          return user;
        }
      }, {
        assign: 'session',
        method: async function (request, h) {

          const userId = `${request.pre.user._id}`;
          const ip = request.remoteAddress;
          const userAgent = request.headers['user-agent'];

          return await Session.create({ userId, ip, userAgent });
        }
      }]
    },
    handler: function (request, h) {

      delete request.pre.user.password;

      const creds = {
        user: request.pre.user,
        session: request.pre.session
      };

      request.cookieAuth.set(creds);

      return creds;
    }
  });

};


module.exports = {
  name: 'api-login',
  dependencies: [
    'hapi-auth-cookie',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
