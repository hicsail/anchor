'use strict';
const Boom = require('boom');
const User = require('../models/user');

const register = function (server, serverOptions) {

  server.route({ //returns the table view template
    method: 'GET',
    path: '/{collectionName}',
    options: {
      auth: {
        strategies: ['session']
      },
      pre: [{
        assign: 'model',
        method: async function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            throw Boom.notFound('Model not found');
          }

          return await model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.getTableView.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.getTableView.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
          }
          return h.continue;
        }
      }, {
        assign: 'scopeCheck',
        method: async function (request, h) {

          const model = request.pre.model;
          const role = User.highestRole(request.auth.credentials.user.roles);

          const userRole = User.highestRole(model.routes.getTableView.scope);
          if (role >= userRole) {
            return true;
          }
          else {
            throw Boom.unauthorized('User permission level is too low');
          }
        }
      }]
    },
    handler: async function (request, h) {

      return h.view('dummy')
    }
  });

  server.route({//returns the edit view template
    method: 'GET',
    path: '/edit/{collectionName}/{id}',
    options: {
      auth: {
        strategies: ['session']
      },
      pre: [{
        assign: 'model',
        method: async function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            throw Boom.notFound('Model not found');
          }

          return await model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.getEditView.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.getEditView.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
          }
          return h.continue;
        }
      }, {
        assign: 'scopeCheck',
        method: async function (request, h) {

          const model = request.pre.model;
          const role = User.highestRole(request.auth.credentials.user.roles);

          const userRole = User.highestRole(model.routes.getEditView.scope);
          if (role >= userRole) {
            return true;
          }
          else {
            throw Boom.unauthorized('User permission level is too low');
          }
        }
      }
      ]
    },
    handler: async function (request, h) {

      return h.view('dummy')
    }

  });

  server.route({//returns the table view template
    method: 'GET',
    path: '/create/{collectionName}',
    options: {
      auth: {
        strategies: ['session']
      },
      pre: [{
        assign: 'model',
        method: async function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            throw Boom.notFound('Model not found');
          }

          return await model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.insertDocument.disabled) {
            throw Boom.forbidden('Route Disabled');
          }
          return h.continue;
        }
      }, {
        assign: 'auth',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.insertDocument.auth) {
            if (!request.auth.isAuthenticated) {
              throw Boom.unauthorized('Authentication Required');
            }
          }
          return h.continue;
        }
      }, {
        assign: 'scopeCheck',
        method: async function (request, h) {

          const model = request.pre.model;
          const role = User.highestRole(request.auth.credentials.user.roles);

          const userRole = User.highestRole(model.routes.insertDocument.scope);
          if (role >= userRole) {
            return true;
          }
          else {
            throw Boom.unauthorized('User permission level is too low');
          }
        }
      }
      ]
    },
    handler: async function (request, h) {

      return h.view('dummy')
    }
  });
};

module.exports = {
  name: 'anchor-web-route',
  register
};
