'use strict';
const register = function (server, serverOptions) {

  server.route({ //returns the table view template
    method: 'GET',
    path: '/{collectionName}',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      return h.view('dummy')
    }
  });

  server.route({//returns the edit view template
    method: 'GET',
    path: '/edit/{collectionName}/{id}',options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      return h.view('dummy')
    }

  });

  server.route({//returns the table view template
    method: 'GET',
    path: '/create/{collectionName}',
    options: {
      auth: {
        strategies: ['session']
      }
    },
    handler: async function (request, h) {

      return h.view('dummy')
    }
  });
};

module.exports = {
  name: 'anchor-web-route',
  register
};
