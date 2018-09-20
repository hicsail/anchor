'use strict';
const Boom = require('boom');
const Joi = require('joi');

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/{collectionName}',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
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
        assign: 'data',
        method: async function (request,h) {

          const url = `/api/${request.params.collectionName}`;
          const dataRequest = {
            method: 'GET',
            url,
            headers: request.headers
          };

          return await server.inject(dataRequest);
        }
      }]
    },
    handler: function (request, h) {

      const props = {
        table: {
          url: `/api/${request.params.collectionName}`,
          columns: request.pre.model.columns,
          rows: request.pre.data.result
        },
        routes: request.pre.model.routes,
        projectName: 'Anchor',
        credentials: request.auth.credentials,
        sidebar: server.plugins['hapi-anchor-model'].sidebar
      };

      return h.view('table',props);
    }
  });

  server.route({
    method: 'GET',
    path: '/{collectionName}/create',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      },
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            throw Boom.notFound('Model not found');
          }

          return model;
        }
      },{
        assign: 'disabled',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.create.disabled) {
            throw Boom.notFound('Model create is disabled');
          }

          return h.continue;
        }
      }]
    },
    handler: function (request, h) {

      const props = {
        projectName: 'Anchor',
        credentials: request.auth.credentials,
        sidebar: server.plugins['hapi-anchor-model'].sidebar,
        schema: Joi.describe(request.pre.model.routes.create.payload),
        url: '/api/' + request.pre.model.collectionName
      };

      return h.view('create', props);
    }
  });

  server.route({
    method: 'GET',
    path: '/{collectionName}/{id}',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      },
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            throw Boom.notFound('Model not found');
          }

          return model;
        }
      },{
        assign: 'disabled',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.getId.disabled) {
            throw Boom.notFound('Model get is disabled');
          }

          return h.continue;
        }
      }, {
        assign: 'data',
        method: async function (request,h) {

          const url = `/api/${request.params.collectionName}/${request.params.id}`;
          const dataRequest = {
            method: 'GET',
            url,
            headers: request.headers
          };

          return (await server.inject(dataRequest)).result;
        }
      }]
    },
    handler: function (request, h) {

      const props = {
        projectName: 'Anchor',
        credentials: request.auth.credentials,
        sidebar: server.plugins['hapi-anchor-model'].sidebar,
        schema: Joi.describe(request.pre.model.schema),
        data: request.pre.data
      };

      return h.view('view', props);
    }
  });

  server.route({
    method: 'GET',
    path: '/{collectionName}/{id}/edit',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      },
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            throw Boom.notFound('Model not found');
          }

          return model;
        }
      },{
        assign: 'disabled',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.getId.disabled) {
            throw Boom.notFound('Model get is disabled');
          }

          return h.continue;
        }
      }, {
        assign: 'data',
        method: async function (request,h) {

          const url = `/api/${request.params.collectionName}/${request.params.id}`;
          const dataRequest = {
            method: 'GET',
            url,
            headers: request.headers
          };

          return (await server.inject(dataRequest)).result;
        }
      }]
    },
    handler: function (request, h) {

      const props = {
        projectName: 'Anchor',
        credentials: request.auth.credentials,
        sidebar: server.plugins['hapi-anchor-model'].sidebar,
        schema: Joi.describe(request.pre.model.routes.update.payload),
        data: request.pre.data,
        url: `/api/${request.pre.model.collectionName}/${request.pre.data._id}`
      };

      return h.view('edit', props);
    }
  });
};

module.exports = {
  name: 'web-anchor',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'auth',
    'hapi-anchor-model'
  ],
  register
};
