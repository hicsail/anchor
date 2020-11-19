'use strict';
const Fs = require('fs');
const DefaultScopes = require('./getRoleNames');

module.exports = (server) => {

  try {
    const data = {};
    server.table().forEach((route) => {

      if (route.hasOwnProperty('path')){//processing routes in server
        const path = route.path;
        const method = route.method.toUpperCase();
        if (!data.hasOwnProperty(method)){
          data[method] = {};
        }
        if (route.settings.hasOwnProperty('auth') && typeof route.settings.auth !== 'undefined' && route.settings.auth.hasOwnProperty('access') ){
          data[method][path] = route.settings.auth.access[0].scope.selection;
        }
        else {//routes don't have scope, assign default value to each route, Array of all role string name in config
          data[method][path] = DefaultScopes;
        }
      }
    });

    Fs.writeFileSync('server/permission-config.json', JSON.stringify(data, null, 2));
  }
  catch (err){
    console.error(err);
    throw err;
  }
};
