'use strict';
const AdmZip = require('adm-zip');
const Archiver = require('archiver');
const Config = require('../../config');
const Exec = require('child_process').exec;
const Fs = require('fs');
const util = require('util');
const Joi = require('joi');
const Boom = require('boom');
const Path = require('path');
const Backup = require('../models/backup');

const readdir = util.promisify(Fs.readdir);
const unlink =  util.promisify(Fs.unlink);

const register = function (server, options) {  

  server.route({
    method: 'POST',
    path: '/api/backups/internal',
    config: {
      isInternal: true
    },
    handler: async function (request, h) {

      return await backup(request, h);
    }
  });

  server.route({
    method: 'POST',
    path: '/api/backups',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: async function (request, h) {
      
      return await backup(request, h);
    }
  });

  server.route({
    method: 'GET',
    path: '/api/backups/refresh',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: async function (request, h) {

      await findBackups();
      await clean();
      return true;
    }
  });



  server.route({
    method: 'PUT',
    path: '/api/backups/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: async function (request, h) {

      const backup = await Backup.findById(request.params.id);

      const inPath = Path.join(__dirname,`../backups/${backup.backupId}.zip`);
      const outPath = Path.join(__dirname,`../backups/${backup.backupId}/`);
      const zip = AdmZip(inPath);
      zip.extractAllTo(outPath, true);
      const databaseName = Config.get('/hapiMongoModels/mongodb/uri').split('/').pop();
      await Exec(`mongorestore --drop -d ${databaseName} '${outPath}/${databaseName}/'`);
      await Exec(`rm -r '${outPath}'`);
      return { message: 'Success' };

    }      
  });


  server.route({
    method: 'DELETE',
    path: '/api/backups/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: async function (request, h) {
      
      const backup = await Backup.findById(request.params.id);

      if (!backup) {

        throw Boom.notFound('backup not found');
      }

      const path = Path.join(__dirname,`../backups/${backup.backupId}.zip`);
      await unlink(path);

      await Backup.findByIdAndDelete(request.params.id);

      return { message: 'Success' };      
    }
  });

  const findBackups = async function () {
    
    const path = Path.join(__dirname, '../backups/');
    const ls = await readdir(path);

    const ids = [];
    for (const item of ls){
      const file = item.split('.');
      if (file.pop() === 'zip') {
        ids.push(file[0]);
      }
    }
    const createIds = [];

    for (const id of ids) {
      const backup = await Backup.findOne({ backupId: id });
      if (!backup) {
        createIds.push(id);
      }
    }

    for (const id of createIds) {
      const path = Path.join(__dirname, `../backups/${id}.zip`);
      const stat = Fs.statSync(path);
      const time = new Date(stat.ctime);
      await Backup.create(id,true,false,time);
    }

    return true;
  }    

  const backup =  async function (request, h) {

    await findBackups();

    const ID = new Backup.ObjectID().toString();
    const path = Path.join(__dirname,'../backups/', ID);
    await Exec(`mkdir '${path}'`);

    const databaseName = Config.get('/hapiMongoModels/mongodb/uri').split('/').pop();
    await Exec(`mongodump -d ${databaseName} -o '${path}'`);

    const outputStream = Fs.createWriteStream(`${path}.zip`);
    const Archive = Archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    outputStream.on('close', () => {
      return true;  
    });

    Archive.on('error', (err) => {
      return err;          
    });

    Archive.pipe(outputStream);

    Archive.directory(path, false).finalize();

    await Exec(`rm -r '${path}'`);

    const backup = await Backup.create(Backup.ObjectID().toString(), true, false);

    await clean();

    return backup;
  }    

  const clean = async function () {

    const path = Path.join(__dirname,'../backups');
    const files = Fs.readdirSync(path);
    const ids = [];

    for (const file of files) {
      const id = file.split('.')[0];
      if (id !== 'backup' && id) {        
        ids.push(id);
      } 
    }

    const backups = await Backup.find({});

    for (const backup of backups) {
      if (ids.indexOf(backup.backupId) === -1) {

        return await Backup.findByIdAndDelete(backup._id.toString());
      }  
    }

    return true;
  } 
};

module.exports = {
  name: 'backup',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};