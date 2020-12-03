'use strict';
const Env = require('dotenv');
const Fs = require('fs');
const Joi = require('joi');
const Path = require('path');
const PermissionConfigTable = require('../permission-config.json');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/api/env',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: PermissionConfigTable.GET['/api/env'] || ['root']
      }
    },
    handler: function (request, h) {

      return Env.config().parsed;
    }
  });

  server.route({
    method: 'GET',
    path: '/api/env/{name}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: PermissionConfigTable.GET['/api/env/{name}'] || ['root']
      }
    },
    handler: function (request, h) {

      return Env.config().parsed[request.params.name];
    }
  });

  server.route({
    method: 'POST',
    path: '/api/env',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: PermissionConfigTable.POST['/api/env'] || ['root']
      },
      validate: {
        payload: Joi.object()
      }
    },
    handler: function (request, h) {

      let env = '';
      for (const key in request.payload) {
        env += `${key}=${request.payload[key]}\n`;
      }
      const path = Path.join(__dirname,'../../.env');
      Fs.writeFileSync(path,env);

      Env.parse(path); //override variables
      return { message: 'Success' };
    }
  });
};

module.exports = {
  name: 'env',
  dependencies: [
    'hapi-anchor-model',
    'auth'
  ],
  register
};
