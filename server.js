'use strict';
const Composer = require('./index');
const User = require('./server/models/user');

Composer((err, server) => {

  if (err) {
    throw err;
  }

  console.log(User.highestRole({ 'clinician': 12, 'admin': 'bkah' }));
  server.start(() => {

    console.log('Started the plot device on port ' + server.info.port);
  });
});
