'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../../config');
const internals = {};
const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');

internals.applyRoutes = function (server, next) {

  const Session = server.plugins['hicsail-hapi-mongo-models'].Session;
  const User = server.plugins['hicsail-hapi-mongo-models'].User;
  const Invite = server.plugins['hicsail-hapi-mongo-models'].Invite;

  server.route({
    method: 'POST',
    path: '/signup',
    config: {
      validate: {
        payload: {
          username: Joi.string().token().lowercase().invalid('root').required(),
          password: Joi.string().required(),
          email: Joi.string().email().lowercase().required(),
          name: Joi.string().required(),
          invite: Joi.string().optional()
        }
      },
      pre: [{
        assign: 'usernameCheck',
        method: function (request, reply) {

          const conditions = {
            username: request.payload.username
          };

          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (user) {
              return reply(Boom.conflict('Username already in use.'));
            }

            reply(true);
          });
        }
      }, {
        assign: 'emailCheck',
        method: function (request, reply) {

          const conditions = {
            email: request.payload.email
          };

          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (user) {
              return reply(Boom.conflict('Email already in use.'));
            }

            reply(true);
          });
        }
      },{
        assign: 'passwordCheck',
        method: function (request, reply) {

          const complexityOptions = Config.get('/passwordComplexity');
          Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions), (err, value) => {

            if (err) {
              return reply(Boom.conflict('Password does not meet complexity standards'));
            }
            reply(true);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const mailer = request.server.plugins.mailer;

      Async.auto({
        user: function (done) {

          const username = request.payload.username;
          const password = request.payload.password;
          const email = request.payload.email;
          const name = request.payload.name;

          User.create(username, password, email, name, done);
        },
        welcome: ['user', function (results, done) {

          const emailOptions = {
            subject: 'Your ' + Config.get('/projectName') + ' account',
            to: {
              name: request.payload.name,
              address: request.payload.email
            }
          };
          const template = 'welcome';

          mailer.sendEmail(emailOptions, template, request.payload, (err) => {

            if (err) {
              console.warn('sending welcome email failed:', err.stack);
            }
          });

          done();
        }],
        session: ['user', function (results, done) {

          const userAgent = request.headers['user-agent'];
          const ip = request.headers['x-forwarded-for'] || request.info.remoteAddress;

          Session.create(results.user._id.toString(), ip, userAgent, done);
        }],
        invite: ['user', function (results, done) {

          const id = request.payload.invite;
          if (id) {
            const update = {
              $set: {
                status: 'Accepted'
              }
            };
            return Invite.findByIdAndUpdate(id, update, done);
          }
          done();
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        const user = results.user;
        const credentials = results.session._id + ':' + results.session.key;
        const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

        request.cookieAuth.set(results.session);
        reply({
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            roles: user.roles
          },
          session: results.session,
          authHeader
        });
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/available',
    config: {
      validate: {
        payload: {
          email: Joi.string().email().lowercase().optional(),
          username: Joi.string().token().lowercase().optional()
        }
      },
      pre: [{
        assign: 'vaildInput',
        method: function (request, reply) {

          const username = request.payload.username;
          const email = request.payload.email;

          if (!username && !email) {
            return reply(Boom.badRequest('invaild submission, submit username and/or email'));
          }
          reply(true);
        }
      }]
    },
    handler: function (request, reply) {

      Async.auto({
        usernameFind: function (done) {

          const username = request.payload.username;


          User.findOne({ username }, done);
        },
        username: ['usernameFind', function (results, done) {

          if (request.payload.username) {
            if (results.usernameFind) {
              return done(null,false);
            }
            return done(null,true);
          }
          return done();
        }],
        emailFind: function (done) {

          const email = request.payload.email;

          User.findOne({ email }, done);
        },
        email: ['emailFind', function (results, done) {

          if (request.payload.email) {
            if (results.emailFind) {
              return done(null,false);
            }
            return done(null,true);
          }
          return done();
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        if (results.email === undefined) {
          delete results.email;
        }

        if (results.username === undefined) {
          delete results.username;
        }

        delete results.usernameFind;
        delete results.emailFind;

        reply(results);
      });
    }
  });
  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'mailer', 'hicsail-hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'signup'
};
