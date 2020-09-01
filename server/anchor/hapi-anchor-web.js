'use strict';
const Fs = require('fs');
const Path = require('path');

const register = async function (server, options) {

  let webPath = '../web/routes/';

  if (options.path) {
    webPath = options.path;
  }

  const plugins = (await readDir(Path.join(__dirname,webPath))).reduce((a,v) => {

    a.push({ plugin: require(Path.join(__dirname,webPath,v)) });
    return a;
  }, []);

  await server.register(plugins);
};

const readDir = (path, opts = 'utf8') =>

  new Promise((res, rej) => {

    Fs.readdir(path, opts, (err, data) => {

      if (err) {
        rej(err);
      }
      else {
        res(data);
      }
    });
  });

module.exports = {
  name: 'hapi-anchor-web',
  register,
  readDir
};

exports.register = register;
