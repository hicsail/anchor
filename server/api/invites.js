'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const Invite = server.plugins['hicsail-hapi-mongo-models'].Invite;
  const User = server.plugins['hicsail-hapi-mongo-models'].User;

  server.route({
    method: 'GET',
    path: '/table/invite',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: function (request, reply) {

      const accessLevel = User.highestRole(request.auth.credentials.user.roles);
      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      let fields = request.query.fields;

      const query = {};
      //no role
      if (accessLevel === 0) {
        query.userId = request.auth.credentials.user._id.toString();
      }
      //analyst
      else if (accessLevel === 1) {
        if (fields) {
          fields = fields.split(' ');
          let length = fields.length;
          for (let i = 0; i < length; ++i) {
            if (User.PHI().concat(['key']).indexOf(fields[i]) !== -1) {

              fields.splice(i, 1);
              i--;
              length--;
            }
          }
          fields = fields.join(' ');
        }
      }
      //clinician
      else if (accessLevel === 2) {
        query.username = request.auth.credentials.user.username;
      }

      let userFields = 'studyID username';
      if (accessLevel === 1) {
        //if analyst remove PHI
        userFields = userFields.split(' ');
        let length = userFields.length;
        for (let i = 0; i < length; ++i) {
          if (User.PHI().indexOf(userFields[i]) !== -1) {

            userFields.splice(i, 1);
            i--;
            length--;
          }
        }
        userFields = userFields.join(' ');
      }
      userFields = User.fieldsAdapter(userFields);

      Invite.pagedLookupById(query,sort,limit,page,User,'user','userId',fields, userFields, (err, results) => {

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
    path: '/invite',
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

      Invite.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/invite',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: Invite.payload
      }
    },
    handler: function (request, reply) {

      Async.auto({
        invite: function (done) {

          Invite.create(request.payload.name,request.payload.email,request.payload.description, request.auth.credentials.user._id.toString(), done);
        },
        email: ['invite', function (results, done) {

          const emailOptions = {
            subject: 'You have been invited to ' + Config.get('/projectName'),
            to: {
              name: request.payload.name,
              address: request.payload.email
            }
          };
          const template = 'invite';
          const context = {
            url: request.headers.origin + '/invite/' + results.invite._id.toString(),
            name: Config.get('/projectName')
          };
          const mailer = request.server.plugins.mailer;

          mailer.sendEmail(emailOptions, template, context, (err) => {

            if (err) {
              console.warn('sending invite email failed:', err.stack);
            }
          });

          done();
        }]
      },(err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results.invite);
      });
    }
  });

  server.route({
    method: 'PUT',
    path: '/invite/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root','admin','researcher']
      },
      validate: {
        payload: Invite.payload
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          email: request.payload.email,
          description: request.payload.description
        }
      };

      Invite.findByIdAndUpdate(id, update, (err, invite) => {

        if (err) {
          return reply(err);
        }

        if (!invite) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(invite);
      });
    }
  });

  server.route({
    method: 'PUT',
    path: '/invite/{id}/reject',
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          status: 'Reject'
        }
      };

      Invite.findByIdAndUpdate(id, update, (err, invite) => {

        if (err) {
          return reply(err);
        }

        if (!invite) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(invite);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/invite/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: function (request, reply) {

      Invite.findById(request.params.id, (err, invite) => {

        if (err) {
          return reply(err);
        }

        if (!invite) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(invite);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/invite/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root','admin','researcher']
      }
    },
    handler: function (request, reply) {

      Invite.findByIdAndDelete(request.params.id, (err, event) => {

        if (err) {
          return reply(err);
        }

        if (!event) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({ message: 'Success.' });
      });
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hicsail-hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'invites'
};
