'use strict';
const Backup = require('../models/backup');
const Boom = require('boom');
const Fs = require('fs');
const Path = require('path');

const register = function (server, serverOptions) {

  server.route({
    method: 'POST',
    path: '/api/backup',
    options: {
      tags: ['api','backups'],
      description: 'Get a paginated list of all backups.',
      auth: {
        strategies: ['simple', 'session', 'token']
      }
    },
    handler: async function (request, h) {

      return await createBackup();
    }
  });

  server.route({
    method: 'POST',
    path: '/api/backup/internal',
    options: {
      auth: false,
      isInternal: true
    },
    handler: async function (request, h) {

      return await createBackup();
    }
  });

  server.route({
    method: 'GET',
    path: '/api/backup/{id}/data',
    options: {
      tags: ['api','backups'],
      description: 'Get a backup by ID',
      auth: {
        strategies: ['simple', 'session', 'token']
      }
    },
    handler: async function (request, h) {

      const backup = await Backup.findById(request.params.id);
      const path = Path.join(__dirname, '../backups/', backup.filename);

      backup.data = await readFile(path);

      return backup;
    }
  });

  server.route({
    method: 'POST',
    path: '/api/backup/data',
    options: {
      tags: ['api','backups'],
      description: 'Create a backup with Data',
      auth: {
        strategies: ['simple', 'session', 'token']
      },
      validate: {
        payload: Backup.payload
      }
    },
    handler: async function (request, h) {

      const filename = request.payload.filename + '.json';
      const path = Path.join(__dirname, '../backups/', filename);

      await writeFile(path, request.payload.data);

      return await Backup.create({
        filename,
        local: true
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/api/backup/restore/{id}',
    options: {
      tags: ['api','backups'],
      description: 'Restore backup by ID',
      auth: {
        strategies: ['simple', 'session', 'token']
      }
    },
    handler: async function (request, h) {

      const backup = await Backup.findById(request.params.id);

      if (!backup) {
        return Boom.notFound('Backup not found');
      }

      const path = Path.join(__dirname, '../backups/', backup.filename);
      const data = await readFile(path);

      for (const collectionName in  server.plugins['hapi-anchor-model'].models) {
        const model = server.plugins['hapi-anchor-model'].models[collectionName];
        if (data[collectionName]) {
          await model.deleteMany({});
        }
        if (data[collectionName].length > 0) {
          await model.insertMany(data[collectionName]);
        }
      }

      await Backup.deleteMany({});
      await createBackupsFromDisk();

      return { message: 'Success' };
    }
  });

  const createBackup = async () => {

    const data = {};
    for (const collectionName in  server.plugins['hapi-anchor-model'].models) {
      data[collectionName] = await server.plugins['hapi-anchor-model'].models[collectionName].find({});
    }

    const filename = new Date().toISOString() + '.json';
    const path = Path.join(__dirname, '../backups/', filename);

    await writeFile(path, data);

    return await Backup.create({
      filename,
      local: true
    });

  };

  const createBackupsFromDisk = async () => {

    const files = (await readDir(Path.join(__dirname, '../backups/'))).filter((filename) => {

      return filename.slice(-5) === '.json';
    });

    const backups = [];
    for (const filename of files) {
      backups.push(await Backup.create({
        filename,
        local: true,
        createdAt: new Date(filename).getTime()
      }));
    }

    return backups;
  };

  const writeFile = (path, data) => {

    return new Promise((resolve, reject) => {

      Fs.writeFile(path, JSON.stringify(data), (err) => {

        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  };

  const readFile = (path) => {

    return new Promise((resolve, reject) => {

      Fs.readFile(path, 'utf8', (err, data) => {

        if (err) {
          return reject(err);
        }
        resolve(JSON.parse(data));
      });
    });
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
};

module.exports = {
  name: 'api-backups',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'hapi-anchor-model',
    'hapi-remote-address'
  ],
  register
};
