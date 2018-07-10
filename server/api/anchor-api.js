'use strict';
const Boom = require('boom');
const Joi = require('joi');
const internals = {};




internals.applyRoutes = function (server,next) {


  server.route({
    //paged find
    method:'GET',
    path:'/api/{collectionName}',
    config: {
      validate: {
        query: {
          fields: Joi.string(),
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      },
      pre: [{
        assign: 'model',
        method: function (request,reply) {

          const model = server.plugin['hapi-anchor-model'].models[request.params.collectionName];

          if (!model) {
            return reply(Boom.notFound('Model not found'));
          }
          reply(model);

        }
      }, {
        assign: 'enabled',
        method: function (request,reply) {

          const model = request.pre.model;

          if (!model.routes.get.disabled) {
            return reply(Boom.notFound('Not Found'));
          }

          reply(true);
        }
      }]

    },
    handler: function (request,reply) {
      
      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      request.pre.model.pagedFind(query,fields,sort,limit,page, (err,results) => {

      })


    }
  });
  next();
};



module.exports = {
  name: 'anchor-api',
  dependencies: [
    'hapi-anchor-models'
  ],
  internals
};

exports.register.attributes = {
  name: 'anchor-api'
};


