'use strict';
// eslint-disable-next-line hapi/hapi-capitalize-modules
const fs = require('fs');
// eslint-disable-next-line hapi/hapi-capitalize-modules
const defaultScopes = require('./getRoleNames');

module.exports = (server) => {

  try {
    const data = {};
    server.table()[0].table.forEach((item) => {

      if (item.hasOwnProperty('path')){//processing routes in server
        const path = item.path;
        const method = item.method.toUpperCase();
        if (!data.hasOwnProperty(method)){
          data[method] = {};
        }
        if (item.settings.hasOwnProperty('auth') && typeof item.settings.auth !== 'undefined' && item.settings.auth.hasOwnProperty('access') ){
          data[method][path] = item.settings.auth.access[0].scope.selection;
        }
        else {//routes don't have scope, assign default value to each route
          data[method][path] = defaultScopes;
        }
      }
    });

    fs.writeFileSync('server/permission-config.json', JSON.stringify(data, null, 2));
  }
  catch (err){
    console.error(err);
    throw err;
  }
};

