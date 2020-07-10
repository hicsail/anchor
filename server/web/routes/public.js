'use strict';
const PermissionConfigTable = require('../../../permission-config');
const DEFAULT_ROLES = require('../../helper/getDefaultRoles');

exports.register = function (server, options, next) {

  server.route({//TODO: this route didn't have any strategies or auth before AND Error occurs when new scope is applied
    method: 'GET',
    path: '/public/{param*}',
    config: {
      security: {
        xframe: {
          rule: 'sameorigin'
        }
      }
    },
    handler: {
      directory: {
        path: './server/web/public/',
        listing: true
      }
    }
  });

  next();
};


exports.register.attributes = {
  name: 'public'
};
