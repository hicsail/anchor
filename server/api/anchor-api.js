'use strict';
const Boom = require('boom');
const internals = {};



internals.applyRoutes = function (server,next) {


  server.route({
    method:'GET',
    path:'/api/{collectionName}',
    config: {
      auth: {
        strategies: ['simple','jwt','session']
      },
      pre: [{
        assign: 'collectionName',
        method: function (request,reply) {

          const collectionName = server.plugin['hapi-anchor-model'].models[request.params.collectionName];

          if (!collectionName) {
            return reply(Boom.notFound('Model not found'));
          }
          reply(collectionName);

        }
      }, {
        assign: 'enabled',
        method: function (request,reply) {

          const collectionName = request.pre.collectionName;

          if (!collectionName.routes.get.disabled) {
            return reply(Boom.notFound('Not Found'));
          }

          reply(true);
        }
      }]

    },
    handler: function (request,reply) {


    }
  });
  next();
};


