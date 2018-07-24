'use strict';
const AnchorModel = require('../anchor/anchor-model');
const Boom = require('boom');
const Joi = require('joi');
const Role = require('../models/role');

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/api/permissions/available',
    options: {
      auth: {
        strategies: ['session','simple']
      }
    },
    handler: function (request, h) {

      const permissions = [];
      server.plugins['hapi-anchor-model'].modelsArray.forEach((model) => {

        if (!model.routes.disable) {
          for (const route in AnchorModel.routeMap) {
            if (!model.routes[route].disable) {
              const method = AnchorModel.routeMap[route].method.toUpperCase();
              const path = AnchorModel.routeMap[route].path.replace(/{collectionName}/g,model.collectionName);
              const tag = model.collectionName;
              permissions.push({ method, path, tag, key: method + path.replace(/{/g,'').replace(/}/g,'').split('/').join('-') });
            }
          }
        }
      });

      server.table().forEach((route) => {

        if (route.path.indexOf('{collectionName}') === -1) {
          const method = route.method.toUpperCase();
          const path = route.path;
          const tag = path.split('/')[2];
          permissions.push({ method, path, tag, key: method + path.split('/').join('-') });
        }
      });

      return permissions;
    }
  });


  server.route({
    method: 'POST',
    path:'/api/permissions/role',
    config: {
      auth: {
        strategies: ['session','simple']
      },
      pre: [{
        assign: 'roleValidation',
        method: function (request,h) {

          const { error } = Joi.validate(request.payload, Role.payload);

          if (error) {
            throw Boom.badRequest(error.message);
          }

          return h.continue;
        }
      }, {
        assign: 'permissions',
        method: async function (request,h) {

          const result = await server.inject({
            method: 'GET',
            url: '/api/permissions/available'
          });

          if (result.statusCode !== 200) {
            throw Boom.badData(result.message);
          }

          return result.result;
        }
      }, {
        assign: 'schema',
        method: function (request,h) {

          return Joi.object().keys(request.pre.permissions.reduce((a, v) => {

            a[v.key] = Joi.boolean().required();
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
    handler: async function (request,h) {

      request.payload.filter = [];
      request.payload.userId = '0000'; //request.auth.credentials.user._id.toString();

      return await Role.create(request.payload);
    }
  });
};


module.exports = {
  name: 'api-permissions',
  dependencies: [
    'auth',
    'hapi-auth-cookie',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
