'use strict';
const Confidence = require('confidence');
const Config = require('./config');
const Package = require('./package.json');
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
        plugin:'inert'
      },
      {
        plugin: 'vision'
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
      /*{
      plugin: './server/mailer'
    },
    {
      plugin: './server/api/auth-attempts',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/backups',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/clinician',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/contact',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/env',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/events',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/feedback',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/index',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/invites',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/login',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/logout',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/sessions',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/signup',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/tokens',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/api/users',
      options: {
        routes: { prefix: '/api' }
      }
    },   
    {
      plugin: './server/web/routes/backup'
    },
    {
      plugin: './server/web/routes/clinician'
    },
    
    {
      plugin: './server/web/routes/events'
    },
    {
      plugin: './server/web/routes/env'
    },
    {
      plugin: './server/web/routes/feedback'
    },    
    {
      plugin: './server/web/routes/invite'
    },    
    {
      plugin: './server/web/routes/public'
    },    
    {
      plugin: './server/web/routes/setup'
    },   
    {
      plugin: './server/web/routes/tokens'
    },
    {
      plugin: './server/web/routes/users'
    },*/
    {
      plugin: './server/web/routes/clinician',
    },
    {
      plugin: './server/web/routes/events'
    },
    {
      plugin: './server/web/routes/invite'
    },
    {
      plugin: './server/web/routes/users'
    },
    {
      plugin: './server/web/routes/feedbacks'
    },
    {
      plugin: './server/web/routes/sessions'
    },
    {
      plugin: './server/web/routes/authAttempts'
    },
    {
      plugin: './server/web/routes/account'
    },
    {
      plugin: './server/web/routes/dashboard'
    },
    {
      plugin: './server/web/routes/login'
    },
    {
      plugin: './server/web/routes/index'
    },
    {
      plugin: './server/web/routes/signup'
    },
    {
      plugin: './server/api/signup'      
    },
    {
      plugin: './server/api/login'      
    }, 
    {
      plugin: './server/api/auth-attempts',
      
    },
    {
      plugin: './server/api/sessions',     
    },
    {
      plugin: './server/api/feedbacks',     
    }, 
    {
      plugin: './server/api/users',     
    },
    {
      plugin: './server/api/invites',     
    }, 
    {
      plugin: './server/api/events',     
    },
    {
      plugin: './server/api/clinician',     
    },      
      /*{
         plugin: 'visionary',          
         options: {
          engines: { html: 'handlebars' },
          relativeTo: __dirname,
          path: './server/web/templates',
          //layout: 'layout',
          layoutPath: './server/web/layouts',
          partialsPath: './server/web/partials',
          helpersPath: './server/web/helpers'                 
        }
      },*/      
      {
        plugin: 'hapi-cron',
        options: {
          jobs: [{
            name: 'backups',
            time: '0 0 0 * * *',
            timezone: 'America/New_York',
            request: {
              method: 'POST',
              url: '/api/backups/internal',
              allowInternals: true
            }
          }]
        }
      },
      {
        plugin: 'hapi-swagger',
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
            }, {
              name: 'auth',
              description: 'endpoints to sign up, login or logout.'
            }, {
              name: 'backups',
              description: 'endpoints auto generated for backup api'
            }, {
              name: 'invites',
              description: 'endpoints auto generated for invite api'
            }, {
              name: 'permissions',
              description: 'endpoints auto generated for permissions api'
            }, {
              name: 'tokens',
              description: 'endpoints auto generated for tokens api'
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

