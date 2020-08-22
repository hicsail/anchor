'use strict';
const Composer = require('./index');
const InitPC = require('./server/helpers/initPermissionConfigTable');
const InitDBRoutes = require('./server/helpers/initDBRoutes');
const PermissionConfigTable = require('./server/permission-config.json');
const NumberOfRoutes = require('./server/helpers/getNumberOfRoutes');
const GetServerRoutes = require('./server/helpers/getServerRoutes');

Composer( (err, server) => {

  if (err) {
    throw err;
  }

  server.start(() => {

    const serverRoutes = GetServerRoutes(server);
    if (NumberOfRoutes(serverRoutes) !== NumberOfRoutes(PermissionConfigTable)) {//initialized the permission config file
      InitPC(server, (errMsg, result) => {

        if (errMsg) {
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
