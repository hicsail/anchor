'use strict';
const Composer = require('./index');
const InitPC = require('./server/helpers/initPermissionConfig');

Composer((err, server) => {

  if (err) {
    throw err;
  }

  server.start(() => {

    InitPC(server);
    console.log('Started the plot device on port ' + server.info.port);
  });
});
