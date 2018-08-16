'use strict';

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: false
    },
    handler: function (request, h) {

      return h.view('home');
    }
  });
};


module.exports = {
  name: 'index',
  register
};
