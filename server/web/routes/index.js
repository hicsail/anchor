'use strict';

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/',
    options: {
      auth: false
    },
    handler: async function (request, h) {



      const dataRequest = {
        method: 'GET',
        url: '/api/users',
        headers: request.headers
      };

      const data = (await server.inject(dataRequest)).result;

      const props = {
        data,
        projectName: 'Anchor',
        credentials: request.auth.credentials
      };

      return h.view('home', props);
    }
  });

  server.route({
    method: 'GET',
    path: '/dataRow',
    options: {
      auth: false
    },
    handler: async function (request, h) {

      const dataRequest = {
        method: 'GET',
        url: '/api/users',
        headers: request.headers
      };

      const data = (await server.inject(dataRequest)).result;

      const props = {
        data,
        projectName: 'Anchor',
        credentials: request.auth.credentials
      };

      return props.data.data;
    }
  });
};


module.exports = {
  name: 'index',
  register
};
