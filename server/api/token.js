'use strict';
const Boom = require('Boom');
const Joi = require('joi');
const Token = require('../models/token');

const register = function (server,serverOptions) {

  server.route({
    method:'POST',
    path: '/api/tokens',
    options: {
      auth: {
        strategies: ['simple','session','token']
      },
      pre: [{
        assign: 'permissions',
        method: async function (request,h) {

          console.log(Token.payload);
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

          return Joi.object().keys(request.pre.permissions.reduce((a,v) => {

            a[v.key] = Joi.boolean();

            return a;
          }, {}));
        }
      },
      {
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
    handler: async function (request,h) {

      request.payload.userId = request.auth.credentials.user._id.toString();

      return await Token.create(request.payload);
    }
  });
};

module.exports = {
  name: 'api-token',
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
