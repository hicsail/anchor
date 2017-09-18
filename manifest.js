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
    connections: {
      routes: {
        security: true
      }
    }
  },
  connections: [{
    port: Config.get('/port/web'),
    labels: ['web']
  }],
  registrations: [
    {
      plugin: 'hapi-auth-basic'
    },
    {
      plugin: 'hapi-auth-cookie'
    },
    {
      plugin: 'lout'
    },
    {
      plugin: 'inert'
    },
    {
      plugin: 'vision'
    },
    {
      plugin: {
        register: 'visionary',
        options: {
          engines: { handlebars: 'handlebars' },
          path: './server/web/templates',
          layout: 'layout',
          layoutPath: './server/web/layouts',
          partialsPath: './server/web/partials',
          helpersPath: './server/web/helpers'
        }
      }
    },
    {
      plugin: {
        register: 'hapi-mongo-models',
        options: {
          mongodb: Config.get('/hapiMongoModels/mongodb'),
          models: {
            AuthAttempt: './server/models/auth-attempt',
            Backup: './server/models/backup',
            Event: './server/models/event',
            Feedback: './server/models/feedback',
            Session: './server/models/session',
            User: './server/models/user'
          },
          autoIndex: Config.get('/hapiMongoModels/autoIndex')
        }
      }
    },
    {
      plugin: {
        register: 'hapi-cron',
        options: {
          jobs: [{
            name: 'backup',
            time: '0 0 * * * *', //every hour
            timezone: 'America/New_York',
            request: {
              method: 'POST',
              url: '/api/backups/internal',
              allowInternals: true
            }
          }]
        }
      }
    },
    {
      plugin: './server/auth'
    },
    {
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
      plugin: './server/api/users',
      options: {
        routes: { prefix: '/api' }
      }
    },
    {
      plugin: './server/web/routes/account'
    },
    {
      plugin: './server/web/routes/authAttempts'
    },
    {
      plugin: './server/web/routes/backup'
    },
    {
      plugin: './server/web/routes/dashboard'
    },
    {
      plugin: './server/web/routes/events'
    },
    {
      plugin: './server/web/routes/env'
    },
    {
      plugin: './server/web/routes/index'
    },
    {
      plugin: './server/web/routes/login'
    },
    {
      plugin: './server/web/routes/public'
    },
    {
      plugin: './server/web/routes/sessions'
    },
    {
      plugin: './server/web/routes/signup'
    },
    {
      plugin: './server/web/routes/users'
    }
  ]
};


const store = new Confidence.Store(manifest);


exports.get = function (key) {

  return store.get(key, criteria);
};


exports.meta = function (key) {

  return store.meta(key, criteria);
};
