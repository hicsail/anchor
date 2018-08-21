'use strict';

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: {
        strategies: ['simple','session','token'],
        mode: 'try'
      }
    },
    handler: function (request, h) {

      const props = {
        projectName: 'Anchor',
        credentials: request.auth.credentials
      };

      return h.view('home', props);
    }
  });
};


module.exports = {
  name: 'index',
  register
};
