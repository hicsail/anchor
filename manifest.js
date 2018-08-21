'use strict';
const Confidence = require('confidence');
const Config = require('./config');

const criteria = {
  env: process.env.NODE_ENV
};

const manifest = {
  $meta: 'This file defines the plot device.',
  server: {
    debug: {
      request: ['error']
    },
    routes: {
      security: true,
      cors: true
    },
    port: Config.get('/port/web')
  },
  register: {
    plugins: [
      {
        plugin: 'good',
        options: {
          reporters: {
            myConsoleReporter: [
              {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{
                  error: '*',
                  log: '*',
                  request: '*',
                  response: '*'
                }]
              },
              {
                module: 'good-file',
                args: ['./server/logs/log']
              },
              {
                module: 'good-console',
                args: [{
                  color: {
                    $filter: 'env',
                    production: false,
                    $default: true
                  }
                }]
              },
              'stdout'
            ]
          }
        }
      },
      {
        plugin: 'hapi-auth-cookie'
      },
      {
        plugin: 'hapi-auth-jwt2'
      },
      {
        plugin: 'hapi-auth-basic'
      },
      {
        plugin: 'hapi-remote-address'
      },
      {
        plugin: './server/anchor/hapi-anchor-model.js',
        options: Config.get('/hapiAnchorModel')
      },
      {
        plugin: './server/auth.js'
      },
      {
        plugin: './server/anchor/hapi-anchor-api'
      },
      {
        plugin: './server/anchor/anchor-api'
      }
    ]
  }
};

const store = new Confidence.Store(manifest);

exports.get = function (key) {

  return store.get(key, criteria);
};

exports.meta = function (key) {

  return store.meta(key, criteria);
};
