'use strict';
const Async = require('async');
const Bcrypt = require('bcrypt');
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const AuthAttempt = server.plugins['hicsail-hapi-mongo-models'].AuthAttempt;
  const Session = server.plugins['hicsail-hapi-mongo-models'].Session;
  const Token = server.plugins['hicsail-hapi-mongo-models'].Token;
  const User = server.plugins['hicsail-hapi-mongo-models'].User;


  server.route({
    method: 'POST',
    path: '/login',
    config: {
      validate: {
        payload: {
          username: Joi.string().lowercase().required(),
          password: Joi.string().required()
        }
      },
      pre: [{
        assign: 'abuseDetected',
        method: function (request, reply) {

          const ip = request.info.remoteAddress;
          const username = request.payload.username;

          AuthAttempt.abuseDetected(ip, username, (err, detected) => {

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
        assign: 'user',
        method: function (request, reply) {

          const username = request.payload.username;
          const password = request.payload.password;

          User.findByCredentials(username, password, (err, user) => {

            if (err) {
              return reply(err);
            }

            reply(user);
          });
        }
      }, {
        assign: 'logAttempt',
        method: function (request, reply) {

          if (request.pre.user) {
            return reply();
          }

          const ip = request.info.remoteAddress;
          const username = request.payload.username;

          AuthAttempt.create(ip, username, request.payload.application, (err, authAttempt) => {

            if (err) {
              return reply(err);
            }

            return reply(Boom.badRequest('Username and password combination not found or account is inactive.'));
          });
        }
      }, {
        assign: 'session',
        method: function (request, reply) {

          const userAgent = request.headers['user-agent'];
          const ip = request.headers['x-forwarded-for'] || request.info.remoteAddress;

          Session.create(request.pre.user._id.toString(), ip, userAgent, (err, session) => {

            if (err) {
              return reply(err);
            }

            request.cookieAuth.set(session);
            return reply(session);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const credentials = request.pre.session._id.toString() + ':' + request.pre.session.key;
      const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

      reply({
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
    path: '/login/forgot',
    config: {
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required()
        }
      },
      pre: [{
        assign: 'user',
        method: function (request, reply) {

          const conditions = {
            email: request.payload.email
          };

          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply({ message: 'Success.' }).takeover();
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const mailer = request.server.plugins.mailer;

      Async.auto({
        keyHash: function (done) {

          Session.generateKeyHash(done);
        },
        user: ['keyHash', function (results, done) {

          const id = request.pre.user._id.toString();
          const update = {
            $set: {
              resetPassword: {
                token: results.keyHash.hash,
                expires: Date.now() + 10000000
              }
            }
          };

          User.findByIdAndUpdate(id, update, done);
        }],
        email: ['user', function (results, done) {

          const emailOptions = {
            subject: 'Reset your ' + Config.get('/projectName') + ' password',
            to: request.payload.email
          };
          const template = 'forgot-password';
          const context = {
            key: results.keyHash.key
          };

          mailer.sendEmail(emailOptions, template, context, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({ message: 'Success.' });
      });
    }
  });

  server.route({
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
  });


  server.route({
    method: 'POST',
    path: '/login/reset',
    config: {
      validate: {
        payload: {
          key: Joi.string().required(),
          email: Joi.string().email().lowercase().required(),
          password: Joi.string().required()
        }
      },
      pre: [{
        assign: 'user',
        method: function (request, reply) {

          const conditions = {
            email: request.payload.email,
            'resetPassword.expires': { $gt: Date.now() }
          };

          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.badRequest('Invalid email or key.'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      Async.auto({
        keyMatch: function (done) {

          const key = request.payload.key;
          const token = request.pre.user.resetPassword.token;
          Bcrypt.compare(key, token, done);
        },
        passwordHash: ['keyMatch', function (results, done) {

          if (!results.keyMatch) {
            return reply(Boom.badRequest('Invalid email or key.'));
          }

          User.generatePasswordHash(request.payload.password, done);
        }],
        user: ['passwordHash', function (results, done) {

          const id = request.pre.user._id.toString();
          const update = {
            $set: {
              password: results.passwordHash.hash
            },
            $unset: {
              resetPassword: undefined
            }
          };

          User.findByIdAndUpdate(id, update, done);
        }],
        removeAuthAttempts: ['user', function (results, done) {

          const ip = request.info.remoteAddress;
          const username = results.user.username;
          AuthAttempt.deleteAuthAttempts(ip, username, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({ message: 'Success.' });
      });
    }
  });


  next();
};


exports.register = function (server, options, next) {

  server.dependency(['mailer', 'hicsail-hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'login'
};
