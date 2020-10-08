'use strict';
const internals = {};
const Config = require('../../../config');
const Token = require('../../models/token');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/tokens',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      return h.view('tokens/index', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Tokens',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/tokens/create',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root', 'admin','researcher']
      }
    },
    handler: async function (request, h) {

      return h.view('tokens/create', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Tokens',
        baseUrl: Config.get('/baseUrl')
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/tokens/{id}',
    options: {
      auth: {
        strategies: ['session'],
        scope: ['root', 'admin','researcher']
      }
    },
    handler: async function (request, h) {      
      
      const token = await Token.findById(request.params.id);     

      return h.view('tokens/edit', {
        user: request.auth.credentials.user,
        projectName: Config.get('/projectName'),
        title: 'Tokens',
        baseUrl: Config.get('/baseUrl'),
        token
      });      
    }
  });

};

module.exports = {
  name: 'tokenList',
  dependencies: [
    'hapi-anchor-model',   
    'auth'   
  ],
  register
};