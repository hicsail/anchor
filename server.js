'use strict';
const Composer = require('./index');
const InitPC = require('./server/helpers/initPermissionConfig');
// eslint-disable-next-line hapi/hapi-capitalize-modules
const fs = require('fs');

Composer((err, server) => {

  if (err) {
    throw err;
  }

  server.start(() => {

    if (!fs.existsSync('server/permission-config.json')){
      InitPC(server);
    }
    console.log('Started the plot device on port ' + server.info.port);
  });
});
