'use strict';
const Fs = require('fs');
const GetRoutes = require('../helpers/getRoutes');

module.exports = (server) => {//initializes the permission-config.json with routes and scopes.

  try {
    GetRoutes('server', server, ((routes) => {

      if (routes){
        Fs.writeFileSync('server/permission-config.json', JSON.stringify(routes, null, 2));
      }
      else {
        console.log('no routes in callback');
      }
    }));
  }
  catch (err){
    console.error(err);
    throw err;
  }
};

