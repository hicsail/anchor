'use strict';
const Boom = require('boom');

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/view/{collectionName}',
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
      }]
    },
    handler: async function (request, h) {

      const url = `/api/${request.params.collectionName}`;

      const dataRequest = {
        method: 'GET',
        url,
        headers: request.headers
      };

      const data = await server.inject(dataRequest);

      const props = {
        table: {
          url,
          columns: request.pre.model.columns,
          rows: data.result
        },
        projectName: 'Anchor',
        credentials: request.auth.credentials,
        sidebar: server.plugins['hapi-anchor-model'].sidebar
      };

      return h.view('table',props);
    }
  });
};

module.exports = {
  name: 'web-table',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'auth',
    'hapi-anchor-model'
  ],
  register
};
