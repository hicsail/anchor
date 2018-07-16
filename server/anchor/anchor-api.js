'use strict';
const Boom = require('boom');
const Joi = require('joi');

const register = function (server,serverOptions) {

  server.route({
    method: 'POST',
    path:'/api/{collectionName}',
    config: {
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            return Boom.notFound('Model not found');
          }

          return model;
        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;
          if (model.routes.create.disabled) {
            return (Boom.notFound('Permission Denied: Route Disabled'));
          }

          return (true);
        },
        assign: 'payload',
        method: function (request,h) {

          const model = request.pre.model;
          return Joi.validate(request.payload,model.routes.create.payload);

        }
      }]
    },
    handler: async function (request,h) {

      const model = request.pre.model;
      const payload = request.payload;

      return await model.create(payload);
    }


  });


  server.route({
    //paged find
    method:'GET',
    path:'/api/{collectionName}',
    config: {
      validate: {
        query: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      },
      pre: [{
        assign: 'model',
        method: function (request,h) {

          const model = server.plugins['hapi-anchor-model'].models[request.params.collectionName];
          if (!model) {
            return (Boom.notFound('Model not found'));
          }
          return model;

        }
      }, {
        assign: 'enabled',
        method: function (request,h) {

          const model = request.pre.model;

          if (model.routes.get.disabled) {
            return (Boom.notFound('Permission Denied: Route Disabled'));
          }

          return (true);
        }
      }]

    },
    handler: async function (request,reply) {

      const model = request.pre.model;

      const query = {};
      const limit = request.query.limit;
      const page = request.query.page;
      const options = {
        sort: model.sortAdapter(request.query.sort)
      };

      return await model.pagedFind(query, page, limit, options);
    }
  });
};



module.exports = {
  name: 'anchor-api',
  dependencies: [
    'auth',
    'hapi-anchor-model'
  ],
  register
};



