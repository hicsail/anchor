'use strict';

exports.register = function (server, options, next) {

  server.route({
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
