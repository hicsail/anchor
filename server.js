'use strict';
const Composer = require('./index');
const InitPC = require('./server/helpers/initPermissionConfigFile');
const Fs = require('fs');

Composer((err, server) => {

  if (err) {
    throw err;
  }

  server.start(() => {

    if (!Fs.existsSync('server/permission-config.json')){
      InitPC(server);
    }
    console.log('Started the plot device on port ' + server.info.port);
  });
});
