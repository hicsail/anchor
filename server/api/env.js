'use strict';
const Env = require('dotenv');
const Fs = require('fs');
const Joi = require('joi');
const Path = require('path');
const PermissionConfigTable = require('../permission-config.json');

const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/env',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: PermissionConfigTable.GET['/api/env'] || ['admin','root']
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
        strategies: ['simple', 'jwt', 'session'],
        scope: PermissionConfigTable.GET['/api/env/{name}'] || ['admin','root']
      }
    },
    handler: function (request, reply) {

      reply(Env.config().parsed[request.params.name]);
    }
  });

  server.route({
    method: 'POST',
    path: '/env',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: PermissionConfigTable.POST['/api/env'] || ['admin','root']
      },
      validate: {
        payload: Joi.object()
      }
    },
    handler: function (request, reply) {

      let env = '';
      for (const key in request.payload) {
        env += `${key}=${request.payload[key]}\n`;
      }
      const path = Path.join(__dirname,'../../.env');
      Fs.writeFileSync(path,env);

      Env.parse(path); //override variables
      return reply({ message: 'Success' });
    }
  });


  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth', 'hicsail-hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'env'
};
