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

    //ToDO: need to ceck if the permission-config file doesn't exist then we call InitPC(server)
    //otherwise we will get stuck in a loop , because we are updating permission-config file
    //server gets started and when ever server gets started we update that again so to aviod this
    //situation you have to add the existance check for the permission-config file
    if (!fs.existsSync('server/permission-config.json')){
      InitPC(server);
    }
    console.log('Started the plot device on port ' + server.info.port);
  });
});
