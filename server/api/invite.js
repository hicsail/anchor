'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Invite = require('../models/invite');

const register = function (server, serverOptions) {

  server.route({
    method: 'POST',
    path: '/api/invite',
    options: {
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

      request.payload.status = 'pending';
      request.payload.permission = {};
      request.payload.role = [];
      request.payload.userId = request.auth.credentials.user._id.toString();

      return await Invite.create(request.payload);
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
