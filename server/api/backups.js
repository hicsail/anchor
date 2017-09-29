'use strict';
const AdmZip = require('adm-zip');
const Archiver = require('archiver');
const Async = require('async');
const Config = require('../../config');
const Exec = require('child_process').exec;
const Fs = require('fs');
const Joi = require('joi');
const Path = require('path');


const internals = {};

internals.applyRoutes = function (server, next) {

  const Backup = server.plugins['hapi-mongo-models'].Backup;

  server.route({
    method: 'GET',
    path: '/table/backups',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: function (request, reply) {

      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      const fields = request.query.fields;

      Backup.pagedFind({}, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({
          draw: request.query.draw,
          recordsTotal: results.data.length,
          recordsFiltered: results.items.total,
          data: results.data,
          error: err
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/backups',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      },
      validate: {
        query: {
          fields: Joi.string(),
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      }
    },
    handler: function (request, reply) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      Backup.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/backups/internal',
    config: {
      isInternal: true
    },
    handler: function (request, reply) {

      backup(request, reply);
    }
  });


  server.route({
    method: 'POST',
    path: '/backups',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: function (request, reply) {

      backup(request, reply);
    }
  });

  server.route({
    method: 'GET',
    path: '/backups/refresh',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: function (request, reply) {

      findBackups();
      clean(null);
      reply(true);
    }
  });



  server.route({
    method: 'PUT',
    path: '/backups/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: function (request, reply) {

      Async.auto({
        backup: function (done) {

          Backup.findById(request.params.id, done);
        },
        unzip: ['backup', function (results, done) {

          const inPath = Path.join(__dirname,`../backups/${results.backup.backupId}.zip`);
          const outPath = Path.join(__dirname,`../backups/${results.backup.backupId}/`);
          const zip = AdmZip(inPath);
          zip.extractAllTo(outPath, true);
          done(null, outPath);
        }],
        restore: ['unzip', function (results, done) {

          const databaseName = Config.get('/hapiMongoModels/mongodb/uri').split('/').pop();
          Exec(`mongorestore --drop -d ${databaseName} '${results.unzip}/${databaseName}/'`, (error, stdout, stderr) => {

            if (error) {
              return done(error);
            }

            return done();
          });
        }],
        rmDir: ['restore', function (results, done) {

          Exec(`rm -r '${results.unzip}'`, (error, stdout, stderr) => {

            if (error) {
              return done(error);
            }

            return done();
          });
        }]
      },(err, result) => {

        if (err) {
          return reply(err);
        }
        reply({ message: 'Success' });
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/backups/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: function (request, reply) {

      Async.auto({
        backup: function (done) {

          Backup.findById(request.params.id, done);
        },
        removeZip:['backup', function (results, done) {

          if (!results.backup) {
            return done(Error('No Backup Found'));
          }

          const path = Path.join(__dirname,`../backups/${results.backup.backupId}.zip`);
          Fs.unlink(path, done);
        }],
        removeBackUp: ['removeZip', function (results, done) {

          Backup.findByIdAndDelete(request.params.id, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({ message: 'Success' });
      });
    }
  });

  const findBackups = function (callback) {

    Async.auto({

      ls: function (done) {

        const path = Path.join(__dirname, '../backups/');
        Fs.readdir(path, done);
      },
      ids: ['ls', function (results, done) {

        const ids = [];
        for (const item of results.ls){
          const file = item.split('.');
          if (file.pop() === 'zip') {
            ids.push(file[0]);
          }
        }
        done(null, ids);
      }],
      backups: ['ids', function (results, done) {

        const createIds = [];

        Async.each(results.ids, (id, eachCallback) => {

          Backup.findOne({ backupId: id }, (err, backup) => {

            if (err){
              return eachCallback(err);
            }

            if (!backup) {
              createIds.push(id);
            }

            eachCallback();
          });
        },(err) => {

          done(err, createIds);
        });
      }],
      create: ['backups', function (results, done) {

        Async.each(results.backups, (id, eachCallback) => {

          const path = Path.join(__dirname, `../backups/${id}.zip`);
          const stat = Fs.statSync(path);
          const time = new Date(stat.ctime);
          Backup.create(id,true,false,eachCallback,time);
        },done);
      }]
    }, callback);
  };

  const backup =  function (request, reply) {

    Async.auto({
      findBackups: function (done) {

        findBackups(done);
      },
      ID: function (done) {

        done(null, new Backup.ObjectID().toString());
      },
      mkdir: ['ID', function (results, done) {

        const path = Path.join(__dirname,'../backups/', results.ID);
        Exec(`mkdir '${path}'`, (error, stdout, stderr) => {

          if (error) {
            return done(error);
          }

          if (stderr) {
            return done(stderr);
          }

          done(null, path);
        });
      }],
      databaseDump: ['mkdir', function (results, done) {

        const databaseName = Config.get('/hapiMongoModels/mongodb/uri').split('/').pop();
        Exec(`mongodump -d ${databaseName} -o '${results.mkdir}'`, (error, stdout, stderr) => {

          if (error) {
            return done(error);
          }

          done(null, true);
        });
      }],
      zip: ['databaseDump', function (results, done) {

        const outputStream = Fs.createWriteStream(`${results.mkdir}.zip`);
        const Archive = Archiver('zip', {
          zlib: { level: 9 } // Sets the compression level.
        });

        outputStream.on('close', () => {

          done(null, true);
        });

        Archive.on('error', (err) => {

          done(err);
        });

        Archive.pipe(outputStream);

        Archive.directory(results.mkdir, false).finalize();
      }],
      removeDir: ['zip', function (results, done) {

        Exec(`rm -r '${results.mkdir}'`, (error, stdout, stderr) => {

          if (error) {
            return done(error);
          }

          if (stderr) {
            return done(stderr);
          }

          done(null, true);
        });
      }],
      backup: ['removeDir', function (results, done) {

        Backup.create(results.ID,results.zip, false, done);
      }],
      clean: function (done) {

        clean(done);
      }

    }, (err, result) => {

      if (err) {
        return reply(err);
      }

      reply(result.backup);
    });
  };

  const clean = function (done) {

    Async.auto({
      backupIds: function (done) {

        const path = Path.join(__dirname,'../backups');
        const files = Fs.readdirSync(path);
        const ids = [];
        Async.each(files, (file, callback) => {

          const id = file.split('.')[0];
          if (id !== 'backup' && id) {

            ids.push(id);
          }
          callback();
        }, (err) => {

          if (err) {
            return done(err);
          }
          done(null, ids);
        });
      },
      cleanBackups: ['backupIds', function (results, done){

        Backup.find({}, (err, backups) => {

          if (err) {
            return done(err);
          }

          Async.each(backups, (doc, callback) => {

            if (results.backupIds.indexOf(doc.backupId) === -1) {

              return Backup.findByIdAndDelete(doc._id.toString(), callback);
            }
            callback();
          }, done);
        });
      }]
    }, done);
  };

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-cron', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'backup'
};

