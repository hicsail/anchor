'use strict';
// eslint-disable-next-line hapi/hapi-capitalize-modules
const fs = require('fs');
const DefaultRoles = require('./getDefaultRoles');

module.exports = (server) => {

  try {
    const data = {};
    const x = server.table()[0].table;
    x.forEach((item) => {

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
          data[method][path] = DefaultRoles;
        }
      }
    });

    fs.writeFileSync('permission-config.json', JSON.stringify(data, null, 2));
  }
  catch (err){
    console.error(err);
    throw err;
  }
};

