'use strict';
const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Fs = require('fs');
const Proxyquire = require('proxyquire');

const lab = exports.lab = Lab.script();
const config = {
  mongodb: {
    connection: {
      uri: 'mongodb://localhost:27017/',
      db: 'hapi-anchor-models-test'
    },
    options: {}
  }
};
const stub = {
  AnchorModel: {}
};
const HapiAnchorModel = Proxyquire('../../../server/anchor/hapi-anchor-model', {
  'anchor-model': stub.AnchorModel
});

lab.experiment('Plugin', () => {

  lab.test('it throws an error id unable to read from directory', async () => {

    const realreadDir = Fs.readdir;

    Fs.readdir = function (path, opts, callback) {

      callback(Error('Can\'t find models directory'));
    };

    const server = Hapi.Server();

    const plugin = {
      plugin: HapiAnchorModel,
      options: config
    };

    const throws = async function () {

      await server.register(plugin);
    };

    await Code.expect(throws()).to.reject();

    Fs.readdir = realreadDir;
  });

  lab.test('it successfuly connects and exposes the plugin (default autoIndex value)', async () => {

    const server = Hapi.Server();

    const plugin = {
      plugin: HapiAnchorModel,
      options: config
    };

    await server.register(plugin);
    await server.start();

    Code.expect(server.plugins['hapi-anchor-model']).to.be.an.object();

    server.plugins['hapi-anchor-model'].anchorModel.disconnect();

    await server.stop();
  });

  lab.test('it successfuly connects and exposes the plugin without any anchorModels', async () => {

    const server = Hapi.Server();

    config.path = '../../test/server/models/';

    const plugin = {
      plugin: HapiAnchorModel,
      options: config
    };

    await server.register(plugin);
    await server.start();

    Code.expect(server.plugins['hapi-anchor-model']).to.be.an.object();

    server.plugins['hapi-anchor-model'].anchorModel.disconnect();

    await server.stop();
  });

  lab.test('it connects to the db and creates indexes during pre-start (autoIndex set manually)', async () => {

    const configClone = JSON.parse(JSON.stringify(config));

    configClone.autoIndex = true;

    const server = Hapi.Server();
    const plugin = {
      plugin: HapiAnchorModel,
      options: configClone
    };

    await server.register(plugin);
    await server.start();

    Code.expect(server.plugins['hapi-anchor-model']).to.be.an.object();

    server.plugins['hapi-anchor-model'].anchorModel.disconnect();

    await server.stop();
  });

  lab.test('it connects to the db and skips creating indexes during pre-start (autoIndex set manually)', async () => {

    const configClone = JSON.parse(JSON.stringify(config));

    configClone.autoIndex = false;

    const server = Hapi.Server();
    const plugin = {
      plugin: HapiAnchorModel,
      options: configClone
    };

    await server.register(plugin);
    await server.start();

    Code.expect(server.plugins['hapi-anchor-model']).to.be.an.object();

    server.plugins['hapi-anchor-model'].anchorModel.disconnect();

    await server.stop();
  });
});
