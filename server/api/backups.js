'use strict';
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
    path: '/backups',
    config: {
      auth: {
        strategies: ['simple', 'session'],
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
    method: 'POST',
    path: '/backups',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin']
      }
    },
    handler: function (request, reply) {

      Async.auto({
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
        }]
      }, (err, result) => {

        if (err) {
          return reply(err);
        }

        reply(result.backup);
      });
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'backup'
};

