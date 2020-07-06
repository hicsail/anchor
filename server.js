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
        if (item.path === '/api/users/{id}' && item.method === 'delete'){
          console.log(item.settings.pre[0].method);
          console.log(path, method);
        }
        if (item.settings.hasOwnProperty('auth') && typeof item.settings.auth !== 'undefined' && item.settings.auth.hasOwnProperty('access') ){
          // console.log(path, method);
          // console.log(item.settings.auth.access[0].scope.selection);
        }
        else {//routes don't have scope, assign default value to each route [‘root’, ‘admin’ ,’researcher’, ‘analyst’,’ clinician‘]
          // console.log('[‘root’, ‘admin’ ,’researcher’, ‘analyst’,’ clinician‘]');
        }
      }
    });
    // const path = Object.keys(x).map((key) => {
    //
    //   console.log(key);
    //   console.log(key === 'path');
    //   if (key === 'path') {
    //     console.log('path found?');
    //     console.log(x[key]);
    //     return x[key];
    //   }
    // });
    PermissionConfig.createTable(server, (result) => {

      console.log(result);
    });
    console.log('Started the plot device on port ' + server.info.port);
  });
});
