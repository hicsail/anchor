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
      security: true
    },
    port: Config.get('/port/web')
  },
  register: {
    plugins: [
      {
        plugin: './server/anchor/hapi-anchor-model.js',
        options: Config.get('/hapiAnchorModel')
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
