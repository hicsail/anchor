'use strict';
const Fs = require('fs');

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/api/logs',
    options: {
      auth: false
    },
    handler: function (request,h) {

      Fs.readFile('/Users/Dope_Esen/SAIL/anchor/server/logs/awesome_log', (err, data) => {

        if (err) {
          throw err;
        }
        const logs = JSON.parse(data);
        console.log(logs);
        return logs;
      });
    }
  });
};

module.exports = {
  name: 'api-logs',
  register
};
