'use strict';
const Fs = require('fs');
const Path = require('path');

const register = function (server, serverOptions) {

  server.route({
    method: 'GET',
    path: '/api/logs',
    options: {
      auth: false
    },
    handler: function (request,h) {

      const appDir = [Path.dirname(require.main.filename),'/server/logs/awesome_log'];
      const filePath = appDir.join('');
      // const logArray = [];

      Fs.readFile(filePath, (err, data) => {

        if (err) {
          throw err;
        }
        console.log(data);

        const logs = JSON.parse(data);

        return logs;
      });
    }
  });
};

module.exports = {
  name: 'api-logs',
  register
};
