'use strict';
const Boom = require('boom');
const internals = {};



internals.applyRoutes = function (server,next) {


  server.route({
    method:'GET',
    path:'/api/{collectionName}',
    config: {
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

      //request.pre.model


    }
  });
  next();
};

module.exports = {
  name: 'Anchor',
  dependencies: [
    'hapi-anchor-models'
  ],
  internals
};


