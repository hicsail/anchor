'use strict';
const Composer = require('./index');
const PermissionConfig = require('./server/models/permission-config');

Composer((err, server) => {

  if (err) {
    throw err;
  }

  server.start(() => {

    const x = server.table()[0].table;
    x.forEach((item) => {

      if (item.hasOwnProperty('path')){//processing routes in server
        const path = item.path;
        const method = item.method;
        // console.log(path, method);
        if (item.settings.hasOwnProperty('auth') && typeof item.settings.auth !== 'undefined' && item.settings.auth.hasOwnProperty('access') ){
          // console.log(item.settings.auth.access[0].scope.selection);
        }
        else {//routes don't have scope, assign default value to each route [‘root’, ‘admin’ ,’researcher’, ‘analyst’,’ clinician‘]
          // console.log('[‘root’, ‘admin’ ,’researcher’, ‘analyst’,’ clinician‘]');
        }
      }
    });
    PermissionConfig.createTable(server, (result) => {

      console.log(result);
    });
    console.log('Started the plot device on port ' + server.info.port);
  });
});
