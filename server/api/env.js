'use strict';
const Env = require('dotenv');


const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/env',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['admin','root']
      }
    },
    handler: function (request, reply) {

      reply(Env.config().parsed);
    }
  });

  server.route({
    method: 'GET',
    path: '/env/{name}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['admin','root']
      }
    },
    handler: function (request, reply) {

      reply(Env.config().parsed[request.params.name]);
    }
  });


  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'env'
};
