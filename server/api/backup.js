'use strict';
const Backup = require('../models/backup');
const Fs = require('fs');
const Path = require('path');


const register = function (server, serverOptions) {

  server.route({
    method: 'POST',
    path: '/api/backup',
    options: {
      auth: false
    },
    handler: async function (request, h) {

      const data = {};
      for (const collectionName in  server.plugins['hapi-anchor-model'].models) {
        data[collectionName] = await server.plugins['hapi-anchor-model'].models[collectionName].find({});
      }

      const filename = new Date().toISOString() + '.json';
      const path = Path.join(__dirname,'../backups/',filename);

      await new Promise((resolve, reject) => {

        Fs.writeFile(path,JSON.stringify(data), (err) => {

          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      });

      const backup = await Backup.create({
        filename,
        local: true
      });

      return backup;
    }
  });
};

module.exports = {
  name: 'api-backups',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
