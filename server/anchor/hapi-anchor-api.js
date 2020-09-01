'use strict';
const Fs = require('fs');
const Path = require('path');

const register = async function (server, options) {

  let apiPath = '../api/';

  if (options.path) {
    apiPath = options.path;
  }

  const plugins = (await readDir(Path.join(__dirname,apiPath))).reduce((a,v) => {

    a.push({ plugin: require(Path.join(__dirname,apiPath,v)) });
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
  name: 'hapi-anchor-api',
  register,
  readDir
};

exports.register = register;
