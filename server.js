'use strict';
const Composer = require('./index');
const InitPC = require('./server/helpers/initPermissionConfigTable');
const Fs = require('fs');
const InitDBRoutes = require('./server/helpers/initDBRoutes');
const PermissionConfigTable = require('./server/permission-config.json');

Composer( (err, server) => {

  if (err) {
    throw err;
  }

  server.start(() => {

    if (!Fs.existsSync('server/permission-config.json') || Object.keys(PermissionConfigTable).length === 0){//initialized the permission config file if it doesn't already exist
      InitPC(server, (errMsg, result) => {

        if (errMsg){
          console.error(errMsg);
        }
      });
    }

    InitDBRoutes(server, (err, result) => {

      if (err) {
        console.error(err);
      }
      else {
        console.log(result);
      }
    });//initializes the database routeScope collection.

    console.log('Started the plot device on port ' + server.info.port);
  });
});
