'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Invite = require('../models/invite');
const User = require('../models/user');

const register = function (server, serverOptions) {

  server.route({
    method: 'POST',
    path: '/api/invites',
    options: {
      tags: ['api','invites'],
      description: 'Create an Invite',
      auth: {
        strategies: ['simple', 'session', 'token']
      },
      validate: {
        payload: Invite.payload
      },
      pre: [{
        assign: 'permissions',
        method: async function (request,h) {

          const result = await server.inject({
            method: 'GET',
            url: '/api/permissions/available',
            headers: request.headers
          });

          return result.result;
        }
      }, {
        assign: 'schema',
        method: function (request,h) {

          return Joi.object().keys(request.pre.permissions.reduce((a, v) => {

            a[v.key] = Joi.boolean();
            return a;
          }, {}));
        }
      }, {
        assign: 'validate',
        method: function (request,h) {

          const { error } = Joi.validate(request.payload.permissions, request.pre.schema);

          if (error) {
            throw Boom.badRequest(error.message);
          }

          return h.continue;
        }
      }]
    },
    handler: async function (request, h) {

      request.payload.userId = request.auth.credentials.user._id.toString();
      return await Invite.create(request.payload);
    }
  });

  server.route({
    method: 'POST',
    path: '/api/invites/{id}',
    options: {
      tags: ['api','invites'],
      description: 'Accept an Invite',
      auth: false,
      validate: {
        payload: User.payload
      },
      pre: [{
        assign: 'invite',
        method: async function (request,h) {

          const invite = await Invite.findById(request.params.id);

          if (!invite) {
            throw Boom.notFound('Invite not found');
          }
          return invite;
        }
      }]
    },
    handler: async function (request, h) {

      const invite = request.pre.invite;

      const signupRequest = {
        method: 'POST',
        url: '/api/signup',
        payload: request.payload
      };

      const signupResponse = await server.inject(signupRequest);
      if (signupResponse.statusCode !== 200) {
        const error = signupResponse.result;
        throw new Boom(error.message,{
          statusCode: error.statusCode
        });
      }

      let user = signupResponse.result.user;
      user = await User.findByIdAndUpdate(user._id, {
        $set : {
          roles: invite.roles,
          permissions: invite.permissions
        }
      });

      await Invite.findByIdAndUpdate(invite._id, {
        $set : {
          status: 'Accepted',
          invitedUser: `${user._id}`
        }
      });

      return user;
    }
  });

};

module.exports = {
  name: 'api-invite',
  dependencies: [
    'auth',
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
