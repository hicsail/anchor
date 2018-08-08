'use strict';
const AnchorModel = require('../anchor/anchor-model');
const Boom = require('boom');
const Joi = require('joi');
const Role = require('../models/role');
const User = require('../models/user');

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/api/permissions/available',
    options: {
      auth: {
        strategies: ['simple','session','token']
      }
    },
    handler: function (request, h) {

      const permissions = [];

      for (const model of  server.plugins['hapi-anchor-model'].modelsArray) {
        for (const route in AnchorModel.routeMap) {
          if (!model.routes[route].disabled) {
            const method = AnchorModel.routeMap[route].method.toUpperCase();
            const path = AnchorModel.routeMap[route].path.replace(/{collectionName}/g,model.collectionName);
            const tag = model.collectionName;
            permissions.push({ method, path, tag, key: method + path.replace(/{/g,'').replace(/}/g,'').split('/').join('-') });
          }
        }
      }

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
    path:'/api/role',
    config: {
      auth: {
        strategies: ['simple','session','token']
      },
      pre: [{
        assign: 'roleValidation',
        method: function (request,h) {

          const { error } = Joi.validate(request.payload, Role.payload);

          if (error) {
            throw Boom.badRequest('Incorrect Payload', error);
          }
          return h.continue;
        }
      }, {
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
    handler: async function (request,h) {

      request.payload.filter = [];
      request.payload.userId = request.auth.credentials.user._id.toString();

      return await Role.create(request.payload);
    }
  });

  server.route({
    method: 'PUT',
    path:'/api/role/{id}',
    config: {
      auth: false,
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
    handler: async function (request,h) {

      const objectid = request.params.id;
      const update = request.payload.permissions;
      const namechange = request.payload.name;

      return await Role.findByIdAndUpdate(objectid,{ $set: { 'permissions' : update, 'name': namechange } });
    }
  });

  server.route({
    method: 'PUT',
    path:'/api/permissions/user/{id}',
    config: {
      auth: false,
      pre: [{
        assign: 'userValidation',
        method: function (request,h) {

          const { error } = Joi.validate(request.payload, User.permissionPayload);

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
    handler: async function (request,h) {

      return await User.findByIdAndUpdate( request.params.id,{ $set: { 'permissions' : request.payload.permissions } });
    }
  });

};


module.exports = {
  name: 'api-permissions',
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
