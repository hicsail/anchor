'use strict';
const Boom = require('Boom');
const Joi = require('joi');
const Token = require('../models/token');

const register = function (server,serverOptions) {

  server.route({
    method:'POST',
    path: '/api/tokens',
    options: {
      auth: {
      }
    }
  });
};

module.exports = {
  name: 'api-token',
  dependencies: [
    'auth',
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
