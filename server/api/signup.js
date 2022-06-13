'use strict';
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');
const Session = require('../models/session');
const User = require('../models/user');
const Mailer = require('../mailer');

const register = function (server, options) {

  server.route({
    method: 'POST',
    path: '/api/signup',
    options: {
      tags: ['api','auth'],
      description: 'Sign up for a new user account.',
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
      },{
        assign: 'passwordCheck',
        method: async function (request, h) {

          const complexityOptions = Config.get('/passwordComplexity');

          try {
            await Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions));
          }
          catch (err) {

            throw Boom.conflict('Password does not meet complexity standards');
          }
          return h.continue;
        }
      }]
    },
    handler: async function (request, h) {

      const username = request.payload.username;
      const password = request.payload.password;
      const email = request.payload.email;
      const name = request.payload.name;

      // create and link account and user documents
      const user = await User.create(username, password, email, name);
      const emailOptions = {
        subject: 'Your ' + Config.get('/projectName') + ' account',
        to: {
          name: request.payload.name,
          ddress: request.payload.email
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
      const ip = request.headers['x-forwarded-for'] || request.info.remoteAddress;

      const doc = {
        userId: user._id.toString(),
        ip,
        userAgent
      };
      const session = await Session.create(doc);

      const credentials = session._id + ':' + session.key;
      const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

      //request.cookieAuth.set(session);
      const result = {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          roles: user.roles
        },
        session,
        authHeader
      };

      return result;
    }
  });

  server.route({
    method: 'POST',
    path: '/available',
    options: {
      auth: false,
      validate: {
        payload: {
          email: Joi.string().email().lowercase().optional(),
          username: Joi.string().token().lowercase().optional()
        }
      },
      pre: [{
        assign: 'vaildInput',
        method: function (request, h) {

          const username = request.payload.username;
          const email = request.payload.email;

          if (!username && !email) {
            throw Boom.badRequest('invaild submission, submit username and/or email');
          }
          return h.continue;
        }
      }]
    },
    handler: async function (request, h) {

      const username = request.payload.username;
      const user1 = await User.findOne({ username });

      if (user1 && username) {
        throw Boom.conflict('username already in use');
      }

      const email = request.payload.email;
      const user2 = await User.findOne({ email });

      if (user2 && email) {
        throw Boom.conflict('email already in use');
      }

      if (user1 && !user2) {
        return { email:false, username:true };
      }
      else if (!user1 && user2) {
        return { email:true, username:false };
      }
      else if (user1 && user2) {
        return { email:true, username:true };
      }

      return { email:false, username:false };
    }
  });

};

module.exports = {
  name: 'signup',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
