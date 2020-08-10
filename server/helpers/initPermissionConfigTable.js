'use strict';
const Fs = require('fs');
const GetRoutes = require('../helpers/getRoutes');

module.exports = (server) => {

  try {
    Fs.writeFileSync('server/permission-config.json', JSON.stringify(GetRoutes('server', server), null, 2));
  }
  catch (err){
    console.error(err);
    throw err;
  }
};

