'use strict';
const Glue = require('glue');
const Manifest = require('./manifest');
const path = require('path');


process.on('unhandledRejection', (reason, promise) => {

  console.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
  console.log(promise)
});

const main = async function () {

  const options = { relativeTo: __dirname };
  const server = await Glue.compose(Manifest.get('/'), options);

  server.route({
     method: 'GET',
      path: '/public/{param*}',
      handler: {
        directory: {
          path: path.join( __dirname, './server/web/public'),
          listing: false,
          index: false
        }
      }
  });

  server.views({
    engines: {handlebars: require('handlebars') },                  
          path: './server/web/templates',
          layout: 'layout',
          layoutPath: './server/web/layouts',
          partialsPath: './server/web/partials',
          helpersPath: './server/web/helpers'
  });  

  await server.start();

  console.log(`Server started on port ${Manifest.get('/server/port')}`);
};

main();
