'use strict';
const AuthAttempt = require('../models/auth-attempt');
const Session = require('../models/session');
const User = require('../models/user');
const Crypto = require('../crypto');
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');
const Mailer = require('../mailer');
//const Token = require('../models/token');

const register = function (server, options) {

  server.route({
    method: 'POST',
    path: '/api/login',
    options: {
      tags: ['api','auth'],
      description: 'Log in with username and password.',
      auth: false,
      validate: {
        payload: {
          username: Joi.string().lowercase().required(),
          password: Joi.string().required()
        }
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      pre: [{
        assign: 'abuseDetected',
        method: async function (request, h) {

          const ip = request.info.remoteAddress;
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

          const username = request.payload.username;
          const password = request.payload.password;
          const ip = request.info.remoteAddress;
          const user = await User.findByCredentials(username, password);
          const userAgent = request.headers['user-agent'];

          if (!user) {

            await AuthAttempt.create(ip, username, userAgent);

            throw Boom.badRequest('Credentials are invalid or account is inactive.');
          }

          return user;
        }
      }, {
        assign: 'session',
        method: async function (request, h) {

          const userAgent = request.headers['user-agent'];
          const ip = request.headers['x-forwarded-for'] || request.info.remoteAddress;

          const doc = {
            userId: request.pre.user._id.toString(),
            ip,
            userAgent
          };
          const session = await Session.create(doc);
          //request.cookieAuth.set(session);
          return session;
        }
      }]
    },
    handler: function (request, h) {

      const credentials = request.pre.session._id.toString() + ':' + request.pre.session.key;
      const authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`;

      request.cookieAuth.set(request.pre.session);
      return ({
        user: {
          _id: request.pre.user._id,
          name: request.pre.user.name,
          username: request.pre.user.username,
          email: request.pre.user.email,
          roles: request.pre.user.roles
        },
        session: request.pre.session,
        authHeader
      });
    }
  });



  server.route({
    method: 'POST',
    path: '/api/login/forgot',
    options: {
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required()
        }
      },
      pre: [{
        assign: 'user',
        method: async function (request, h) {

          const conditions = {
            email: request.payload.email
          };

          const user = await User.findOne(conditions);

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

  /*server.route({
    method: 'POST',
    path: '/login/token',
    config: {
      validate: {
        payload: {
          token: Joi.string().required(),
          application: Joi.string().default('Web')
        }
      },
      pre: [{
        assign: 'abuseDetected',
        method: function (request, reply) {

          const ip = request.info.remoteAddress;
          const token = request.payload.token;

          AuthAttempt.abuseDetected(ip, token, (err, detected) => {

            if (err) {
              return reply(err);
            }

            if (detected) {
              return reply(Boom.badRequest('Maximum number of auth attempts reached. Please try again later.'));
            }

            reply();
          });
        }
      }, {
        assign: 'token',
        method: function (request, reply) {

          Token.findById(request.payload.token, (err, token) => {

            if (err) {
              return reply(err);
            }
            reply(token);
          });
        }
      }, {
        assign: 'logAttempt',
        method: function (request, reply) {

          if (request.pre.token && request.pre.token.active) {
            return reply();
          }

          const ip = request.info.remoteAddress;
          const token = request.payload.token;

          AuthAttempt.create(ip, token, request.payload.application, (err, authAttempt) => {

            if (err) {
              return reply(err);
            }

            return reply(Boom.badRequest('Token not found or token is inactive.'));
          });
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const token = request.pre.token;
          User.findById(token.userId, (err, user) => {

            if (err) {
              return reply(err);
            }
            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      reply({
        user: {
          _id: request.pre.user._id,
          name: request.pre.user.name,
          username: request.pre.user.username,
          email: request.pre.user.email,
          roles: request.pre.user.roles
        },
        token: request.pre.token.token
      });
    }
  });*/


  server.route({
    method: 'POST',
    path: '/api/login/reset',
    options: {
      tags: ['api','auth'],
      description: 'Verify Key to reset new password',
      auth: false,
      validate: {
        payload: {
          key: Joi.string().required(),
          email: Joi.string().email().lowercase().required(),
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
};

module.exports = {
  name: 'api-login',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
