'use strict';
const Auth = require('../../../server/auth');
const Code = require('code');
const Hapi = require('hapi');
const Inert = require('inert');
const Lab = require('lab');
const Fs = require('fs');
const Manifest = require('../../../manifest');
const Proxyquire = require('proxyquire');

const lab = exports.lab = Lab.script();
const HapiAnchorWeb = Proxyquire('../../../server/anchor/hapi-anchor-web', {});

lab.experiment('Hapi Anchor Web Plugin', () => {

  lab.test('it successfully registers the plugin', async () => {

    const server = Hapi.Server();

    const plugins = Manifest.get('/register/plugins')
      .filter((entry) => Auth.dependencies.includes(entry.plugin))
      .map((entry) => {

        entry.plugin = require(entry.plugin);

        return entry;
      });

    plugins.push({ plugin: require('../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
    plugins.push(Auth);
    plugins.push(Inert);

    await server.register(plugins);

    const realreadDir = Fs.readdir;

    Fs.readdir = function (path, opts, callback) {

      callback(Error('Can\'t find models directory'));
    };

    const plugin = {
      plugin: HapiAnchorWeb
    };

    const throws = async function () {

      await server.register(plugin);
    };

    await Code.expect(throws()).to.reject();

    Fs.readdir = realreadDir;
  });

  lab.test('it successfully starts with custom path', async () => {

    const server = Hapi.Server();

    const plugins = Manifest.get('/register/plugins')
      .filter((entry) => Auth.dependencies.includes(entry.plugin))
      .map((entry) => {

        entry.plugin = require(entry.plugin);

        return entry;
      });

    plugins.push({ plugin: require('../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
    plugins.push(Auth);
    plugins.push(Inert);
    plugins.push({
      plugin: HapiAnchorWeb,
      options: {
        path: '../../server/web/routes/'
      }
    });

    const throws = async function () {

      return await server.register(plugins);
    };

    await Code.expect(throws()).to.not.reject();
  });
});