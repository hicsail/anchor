'use strict';
const Confidence = require('confidence');
const Config = require('./config');
const Package = require('./package.json');

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

            myFileReporter: [{
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{ ops: '*' }]
            }, {
              module: 'good-squeeze',
              name: 'SafeJson'
            }, {

              module: 'good-file',
              args: ['./server/logs/awesome_log']
            }

            ],

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
      },
      {
        plugin: 'hapi-cron',
        options: {
          jobs: [{
            name: 'backup',
            time: '0 0 0 * * *',
            timezone: 'America/New_York',
            request: {
              method: 'POST',
              url: '/api/backup/internal',
              allowInternals: true
            }
          }]
        }
      },
      {
        plugin:'inert'
      },
      {
        plugin:'vision'
      },
      {
        plugin:'hapi-swagger',
        options: {
          securityDefinitions: {
            'basic': {
              'type': 'apiKey',
              'name': 'Authorization',
              'in': 'header'
            }
          },
          security: [{ 'basic': [] }],
          info: {
            title: 'Anchor API Documentation',
            version: Package.version,
            description: `Anchor API`
          },
          grouping: 'tags',
          sortTags: 'name',
          tags: [
            {
              name: 'anchor-api',
              description: 'endpoints auto generator for each Anchor Model.'
            },{
              name: 'auth',
              description: 'endpoints to sign up, login or logout.'
            },{
              name: 'backups',
              description: 'endpoints auto generated for backup api'
            }
          ]
        }
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
