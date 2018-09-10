'use strict';
const Confidence = require('confidence');
const Config = require('./config');
const HapiReactViews = require('hapi-react-views');
const Path = require('path');


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
      },
      {
        plugin: 'vision',
        options: {
          engines: {
            jsx: HapiReactViews
          },
          compileOptions: {
            removeCacheRegExp: '.jsx$',
            layoutPath: Path.join(process.cwd(), './server/web/views/pages/')
          },
          relativeTo: __dirname,
          path: './server/web/views/pages'
        }
      },

      {
        plugin: 'inert'
      },
      {
        plugin: './server/anchor/hapi-anchor-web'
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
