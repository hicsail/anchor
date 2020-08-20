'use strict';
const Fs = require('fs');
const GetRoutes = require('../helpers/getRoutes');

module.exports = (server, callback) => {//initializes the permission-config.json with routes and scopes.

  try {
    GetRoutes('server', server, ((err, routes) => {//callback function to write the routes found in server into the permission-config.json

      if (err) {
        return callback(err, null);
      }
      Fs.writeFileSync('server/permission-config.json', JSON.stringify(routes, null, 2));
      callback(null, true);
    }));
  }
  catch (err){
    callback(err, null);
  }
};

