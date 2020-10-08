'use strict';

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/public/{param*}',
    options: {
      auth: false
    },
    handler: {
      directory: {
        path: 'server/web/public/',
        listing: false
      }
    }
  });
};

module.exports = {
  name: 'web-public',
  dependencies: ['inert'],
  register
};