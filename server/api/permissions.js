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
      auth: false
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
    method: 'DELETE',
    path: '/api/permissions/user/{userId}/role/{roleId}',
    config: {
      auth: false,
      pre: [{
        assign: 'user',
        method: async function (request,h) {

          const user = await User.findById(request.params.userId);

          if (!user) {
            throw Boom.notFound('Error finding User');
          }
          return user;
        }
      },
      {
        assign: 'role',
        method: async function (request,h) {

          const role = await Role.findById(request.params.roleId);
          if (!role) {
            throw Boom.notFound('Error finding role');
          }

          return role;
        }
      }]
    },
    handler: async function (request,h) {

      const user = request.pre.user;
      const role = request.pre.role;

      if (role._id !== user.roles._id) {
        return user;
      }

      return await User.findByIdAndUpdate();
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/permissions/user/{userId}/role/{roleId}',
    config: {
      auth: false,
      pre: [{
        assign: 'user',
        method: async function (request,h) {

          const user = await User.findById(request.params.userId);
          if (!user) {
            throw Boom.notFound('Error finding User');
          }
          return user;
        }
      },
      {
        assign: 'role',
        method: async function (request,h) {

          const role = await Role.findById(request.params.roleId);

          if (!role) {
            throw Boom.notFound('Error finding role');
          }

          return role;


        }
      }]
    },
    handler: async function (request,h) {

      const user = request.pre.user;
      const role = request.pre.role;
      const roles = user.roles;


      for (const i in roles) {
        if (String(user.roles[i]._id) === String(role._id)){

          console.log('hello');
          return user;
        }
      }



      roles.push(role);



      const update = {
        $set: {
          roles
        }
      };

      const id = user._id;


      return await User.findByIdAndUpdate(id,update);

    }
  });


  server.route({
    method: 'POST',
    path:'/api/permissions/role',
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
      request.payload.userId = '0000'; //request.auth.credentials.user._id.toString();

      return await Role.create(request.payload);
    }
  });

  server.route({
    method: 'PUT',
    path:'/api/permissions/role/{id}',
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
      return await User.findByIdAndUpdate(objectid,{ $set: { 'permissions' : update } });
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
