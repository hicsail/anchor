'use strict';
const Async = require('async');
const Joi = require('joi');
const User = require('../../models/user');
const Config = require('../../../config');
const Boom = require('boom');
const PasswordComplexity = require('joi-password-complexity');

const internals = {};

internals.applyRoutes = function (server, next) {


  server.route({
    method: 'GET',
    path: '/setup',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {

      User.findOne({ username: 'root' }, (err, rootUser) => {

        if (err) {
          return reply(err);
        }

        return reply.view('setup/index', {
          root: rootUser,
          user: request.auth.credentials ? request.auth.credentials.user : null,
          projectName: Config.get('/projectName'),
          title: 'Setup',
          baseUrl: Config.get('/baseUrl')
        });
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/setup',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required(),
          password: Joi.string().required()
        }
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      pre:[{
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
      },{
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
      }]
    },
    handler: function (request, reply) {

      Async.auto({
        user: function (done) {

          Async.auto({
            passwordHash: User.generatePasswordHash.bind(this, request.payload.password)
          }, (err, passResults) => {

            if (err) {
              return done(err);
            }

            const document = {
              _id: User.ObjectId('000000000000000000000000'),
              isActive: true,
              username: 'root',
              name: 'Root',
              password: passResults.passwordHash.hash,
              email: request.payload.email.toLowerCase(),
              roles: {
                root: true
              },
              timeCreated: new Date()
            };

            User.insertOne(document, (err, docs) => {

              done(err, docs[0]);
            });
          });
        }
      }, (err, dbResults) => {

        if (err) {
          return reply(err);
        }
        return reply.redirect('/setup');
      });
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'setup',
  dependencies: 'visionary'
};
