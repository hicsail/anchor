'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../../config');
const internals = {};
const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');

internals.applyRoutes = function (server, next) {

  const Session = server.plugins['hapi-mongo-models'].Session;
  const User = server.plugins['hapi-mongo-models'].User;


  server.route({
    method: 'POST',
    path: '/signup',
    config: {
      validate: {
        payload: {
          username: Joi.string().token().lowercase().required(),
          password: Joi.string().required(),
          email: Joi.string().email().lowercase().required(),
          name: Joi.string().required(),
          info: Joi.object().optional(),
          application: Joi.string().default('Web')
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
          const info = request.payload.info;

          User.create(username, password, email, name, info, done);
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

          Session.create(results.user._id.toString(), request.payload.application, done);
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
            if (results.username) {
              return done(null,false);
            }
            return done(null,true);

          }
        }],
        emailFind: function (done) {

          const email = request.payload.email;

          User.findOne({ email }, done);
        },
        email: ['emailFind', function (results, done) {

          if (request.payload.email) {
            if (results.email) {
              return done(null,false);
            }
            return done(null,true);

          }
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
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

  server.dependency(['auth', 'mailer', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'signup'
};
