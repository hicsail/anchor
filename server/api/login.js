'use strict';
const AuthAttempt = require('../models/auth-attempt');
const Boom = require('boom');
const Config = require('../../config');
const Crypto = require('../crypto');
const Joi = require('joi');
const Mailer = require('../mailer');
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
          const detected = await AuthAttempt.abuseDetected(ip,username);

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
      delete request.pre.user.resetPassword;

      const creds = {
        user: request.pre.user,
        session: request.pre.session,
        authHeader:  `Basic ${Buffer.from(`${request.pre.session._id}:${request.pre.session.key}`).toString('base64')}`
      };

      request.cookieAuth.set(creds);

      return creds;
    }
  });


  server.route({
    method: 'POST',
    path: '/api/login/forgot',
    options: {
      auth: false,
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required()
        }
      },
      pre: [{
        assign: 'user',
        method: async function (request, h) {

          const query = { email: request.payload.email };
          const user = await User.findOne(query);

          if (!user) {
            const response = h.response({ message: 'Success.' });

            return response.takeover();
          }

          return user;
        }
      }]
    },
    handler: async function (request, h) {

      // set reset token

      const keyHash = await Crypto.generateKeyHash();
      const update = {
        $set: {
          resetPassword: {
            token: keyHash.hash,
            expires: Date.now() + 10000000
          }
        }
      };

      await User.findByIdAndUpdate(request.pre.user._id, update);

      // send email

      const projectName = Config.get('/projectName');
      const emailOptions = {
        subject: `Reset your ${projectName} password`,
        to: request.payload.email
      };
      const template = 'forgot-password';
      const context = { key: keyHash.key };

      await Mailer.sendEmail(emailOptions, template, context);

      return { message: 'Success.' };
    }
  });


  server.route({
    method: 'POST',
    path: '/api/login/reset',
    options: {
      auth: false,
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required(),
          key: Joi.string().required(),
          password: Joi.string().required()
        }
      },
      pre: [{
        assign: 'user',
        method: async function (request, h) {

          const query = {
            email: request.payload.email,
            'resetPassword.expires': { $gt: Date.now() }
          };
          const user = await User.findOne(query);

          if (!user) {
            throw Boom.badRequest('Invalid email or key.');
          }

          return user;
        }
      }]
    },
    handler: async function (request, h) {

      // validate reset token

      const key = request.payload.key;
      const token = request.pre.user.resetPassword.token;
      const keyMatch = await Crypto.compare(key, token);

      if (!keyMatch) {
        throw Boom.badRequest('Invalid email or key.');
      }

      // update user

      const password = request.payload.password;
      const passwordHash = await User.generatePasswordHash(password);
      const update = {
        $set: {
          password: passwordHash.hash
        },
        $unset: {
          resetPassword: undefined
        }
      };

      await User.findByIdAndUpdate(request.pre.user._id, update);

      return { message: 'Success.' };
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/logout',
    options: {
      auth: {
        strategies: ['session','simple'],
        mode: 'try'
      }
    },
    handler: function (request, h) {

      const credentials = request.auth.credentials;

      if (!credentials) {
        return { message: 'Success.' };
      }

      Session.findByIdAndDelete(credentials.session._id);

      return { message: 'Success.' };
    }
  });
};


module.exports = {
  name: 'api-login',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
