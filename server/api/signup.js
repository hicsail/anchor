'use strict';
const Boom = require('boom');
const Config = require('../../config');
const Mailer = require('../mailer');
const Session = require('../models/session');
const User = require('../models/user');


const register = function (server, serverOptions) {

  server.route({
    method: 'POST',
    path: '/api/signup',
    options: {
      auth: false,
      validate: {
        payload: User.payload
      },
      pre: [{
        assign: 'usernameCheck',
        method: async function (request, h) {

          const user = await User.findByUsername(request.payload.username);

          if (user) {
            throw Boom.conflict('Username already in use.');
          }

          return h.continue;
        }
      }, {
        assign: 'emailCheck',
        method: async function (request, h) {

          const user = await User.findByEmail(request.payload.email);

          if (user) {
            throw Boom.conflict('Email already in use.');
          }

          return h.continue;
        }
      }]
    },
    handler: async function (request, h) {

      // create and link account and user documents
      const user = await User.create(request.payload);

      const emailOptions = {
        subject: `Your ${Config.get('/projectName')} account`,
        to: {
          name: request.payload.name,
          address: request.payload.email
        }
      };

      try {
        await Mailer.sendEmail(emailOptions, 'welcome', request.payload);
      }
      catch (err) {
        request.log(['mailer', 'error'], err);
      }

      // create session

      const userAgent = request.headers['user-agent'];
      const ip = request.remoteAddress;
      const session = await Session.create({ userId: `${user._id}`, ip, userAgent });

      // create auth header

      const credentials = `${session._id}:${session.key}`;
      const authHeader = `Basic ${new Buffer(credentials).toString('base64')}`;

      delete user.password;
      delete user.resetPassword;

      const creds = {
        user,
        session,
        authHeader
      };

      request.cookieAuth.set(creds);

      return creds;
    }
  });
};


module.exports = {
  name: 'api-signup',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
