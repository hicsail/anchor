'use strict';

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: false
    },
    handler: function (request, h) {

      const context = {
        context: {
          projectName: 'Anchor',
          credentials: request.auth.credentials
        }
      };

      return h.view('home', context);
    }
  });
};


module.exports = {
  name: 'index',
  register
};
