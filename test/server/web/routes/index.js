'use strict';
const Auth = require('../../../../server/auth');
const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Index = require('../../../../server/web/routes/index');
const Manifest = require('../../../../manifest');

const lab = exports.lab = Lab.script();
let server;
let request;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => Index.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });
  plugins.push({ plugin: require('../../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
  plugins.push(Auth);
  plugins.push(Index);

  await server.register(plugins);
  await server.start();

});


lab.experiment('Main Page View', () => {

  lab.test('main page renders properly', (done) => {

    request = {
      method: 'GET',
      url: '/'
    };

    server.inject(request, (response) => {

      Code.expect(response.result).to.match(/Success/i);
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });


  lab.test('main page handles custom status from client', (done) => {

    request = {
      method: 'GET',
      url: '/not-found'
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });
});

