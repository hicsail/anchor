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

      console.log(JSON.stringify(request.headers) + ' headers');

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

      console.log(JSON.stringify(props.data.data));

      return h.view('home',props);
    }
  });
};


module.exports = {
  name: 'index',
  register
};
