'use strict';
const Async = require('async');
const Boom = require('boom');
const Clinician = require('../models/clinician');
const Config = require('../../config');
const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');
const ScopeArray = require('../helpers/getScopes');
const PermissionConfigTable = require('../permission-config.json');
const DefaultScopes = require('../helpers/getRoleNames');
const RouteScope = require('../models/route-scope');
const PermissionConfigFile = require('../permission-config.json');
const Fs = require('fs');


const internals = {};


internals.applyRoutes = function (server, next) {

  const User = server.plugins['hicsail-hapi-mongo-models'].User;

  server.route({
    method: 'GET',
    path: '/table/users',
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

      const query = {
        username: { $regex: request.query['search[value]'].toLowerCase() }
      };
      //no role
      if (accessLevel === 0) {
        query._id = request.auth.credentials.user._id;
      }
      //analyst
      else if (accessLevel === 1) {
        if (fields) {
          fields = fields.split(' ');
          let length = fields.length;
          for (let i = 0; i < length; ++i) {
            if (User.PHI().indexOf(fields[i]) !== -1) {

              fields.splice(i, 1);
              i--;
              length--;
            }
          }
          fields = fields.join(' ');
        }
        query.inStudy = true;
      }
      //clinician
      else if (accessLevel === 2) {
        query._id = {
          $in: request.auth.credentials.user.roles.clinician.userAccess
        };
      }

      User.pagedFind(query, fields, sort, limit, page, (err, results) => {

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
    path: '/select2/users',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: {
          term: Joi.string(),
          _type: Joi.string(),
          q: Joi.string()
        }
      }
    },
    handler: function (request, reply) {

      const query = {
        $or: [
          { email: { $regex: request.query.term, $options: 'i' } },
          { name: { $regex: request.query.term, $options: 'i' } },
          { username: { $regex: request.query.term, $options: 'i' } }
        ]

      };
      const fields = 'name email username';
      const limit = 25;
      const page = 1;

      User.pagedFind(query, fields, null, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({
          results: results.data,
          pagination: {
            more: results.pages.hasNext
          }
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/users',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/users', 'GET', DefaultScopes)
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

      User.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/users/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/users/{id}', 'GET', ['admin'])
      }
    },
    handler: function (request, reply) {

      User.findById(request.params.id, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/users/my',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
    },
    handler: function (request, reply) {

      const id = request.auth.credentials.user._id.toString();
      const fields = User.fieldsAdapter('username email roles');

      User.findById(id, fields, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found. That is strange.'));
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/users',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/users', 'POST', ['root','admin','researcher'])
      },
      validate: {
        payload: User.payload
      },
      pre: [
        {
          assign: 'usernameCheck',
          method: function (request, reply) {

            const conditions = {
              username: request.payload.username
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Username already in use.'));
              }

              reply(true);
            });
          }
        }, {
          assign: 'emailCheck',
          method: function (request, reply) {

            const conditions = {
              email: request.payload.email
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Email already in use.'));
              }

              reply(true);
            });
          }
        }, {
          assign: 'passwordCheck',
          method: function (request, reply) {

            const complexityOptions = Config.get('/passwordComplexity');
            Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions), (err, value) => {

              if (err) {
                return reply(Boom.conflict('Password does not meet complexity standards'));
              }
              reply(true);
            });
          }
        }]
    },
    handler: function (request, reply) {

      const username = request.payload.username;
      const password = request.payload.password;
      const email = request.payload.email;
      const name = request.payload.name;

      User.create(username, password, email, name, (err, user) => {

        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/users/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/users/{id}', 'PUT', ['admin'])
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        },
        payload: {
          username: Joi.string().token().lowercase().required(),
          email: Joi.string().email().lowercase().required(),
          name: Joi.string().required()
        }
      },
      pre: [
        {
          assign: 'usernameCheck',
          method: function (request, reply) {

            const conditions = {
              username: request.payload.username,
              _id: { $ne: User._idClass(request.params.id) }
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Username already in use.'));
              }

              reply(true);
            });
          }
        }, {
          assign: 'emailCheck',
          method: function (request, reply) {

            const conditions = {
              email: request.payload.email,
              _id: { $ne: User._idClass(request.params.id) }
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Email already in use.'));
              }

              reply(true);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          username: request.payload.username,
          email: request.payload.email
        }
      };

      User.findByIdAndUpdate(id, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(user);
      });
    }
  });

  server.route({
    method: 'PUT',
    path: '/users/{id}/participation',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/users/{id}/participation', 'PUT', ['root', 'admin', 'researcher'])
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        },
        payload: {
          inStudy: Joi.boolean().required(),
          studyID: Joi.number().required()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          inStudy: request.payload.inStudy,
          studyID: request.payload.studyID
        }
      };

      User.findByIdAndUpdate(id, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/users/my',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: {
          username: Joi.string().token().lowercase().required(),
          email: Joi.string().email().lowercase().required(),
          name: Joi.string().required(),
          gender: Joi.string().allow('male', 'female'),
          dob: Joi.date(),
          address: Joi.string().allow('').optional(),
          phone: Joi.string().allow('').optional(),
          height: Joi.number().optional(),
          weight: Joi.number().optional()
        }
      },
      pre: [
        {
          assign: 'usernameCheck',
          method: function (request, reply) {

            const conditions = {
              username: request.payload.username,
              _id: { $ne: request.auth.credentials.user._id }
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Username already in use.'));
              }

              reply(true);
            });
          }
        }, {
          assign: 'emailCheck',
          method: function (request, reply) {

            const conditions = {
              email: request.payload.email,
              _id: { $ne: request.auth.credentials.user._id }
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Email already in use.'));
              }

              reply(true);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const id = request.auth.credentials.user._id.toString();
      const update = {
        $set: {
          username: request.payload.username,
          email: request.payload.email,
          name: request.payload.name,
          gender: request.payload.gender,
          dob: request.payload.dob,
          address: request.payload.address,
          phone: request.payload.phone,
          height: request.payload.height,
          weight: request.payload.weight
        }
      };
      const findOptions = {
        fields: User.fieldsAdapter('username email roles gender dob address phone height weight')
      };

      User.findByIdAndUpdate(id, update, findOptions, (err, user) => {

        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/users/{id}/password',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/users/{id}/password', 'PUT', ['root','admin'])
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        },
        payload: {
          password: Joi.string().required()
        }
      },
      pre: [
        {
          assign: 'password',
          method: function (request, reply) {

            User.generatePasswordHash(request.payload.password, (err, hash) => {

              if (err) {
                return reply(err);
              }

              reply(hash);
            });
          }
        },{
          assign: 'passwordCheck',
          method: function (request, reply) {

            const complexityOptions = Config.get('/passwordComplexity');
            Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions), (err, value) => {

              if (err) {
                return reply(Boom.conflict(err.message));
              }
              reply(true);
            });
          }
        },{
          assign: 'scopeCheck',
          method: function (request, reply) {

            const id = request.params.id;
            const role = User.highestRole(request.auth.credentials.user.roles);
            User.findById(id, (err, user) => {

              if (err) {
                return reply(err);
              }

              const userRole = User.highestRole(user.roles);
              if (role > userRole) {
                reply(true);
              }
              else {
                return reply(Boom.unauthorized('User does not have permission to update this users password'));
              }
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          password: request.pre.password.hash
        }
      };

      User.findByIdAndUpdate(id, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/users/my/password',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: {
          password: Joi.string().required()
        }
      },
      pre: [{
        assign: 'password',
        method: function (request, reply) {

          User.generatePasswordHash(request.payload.password, (err, hash) => {

            if (err) {
              return reply(err);
            }

            reply(hash);
          });
        }
      },{
        assign: 'passwordCheck',
        method: function (request, reply) {

          const complexityOptions = Config.get('/passwordComplexity');
          Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions), (err, value) => {

            if (err) {
              return reply(Boom.conflict('Password does not meet complexity standards'));
            }
            reply(true);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const id = request.auth.credentials.user._id.toString();
      const update = {
        $set: {
          password: request.pre.password.hash
        }
      };

      User.findByIdAndUpdate(id, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/users/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/users/{id}', 'DELETE', ['root','admin'])
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      }
    },
    handler: function (request, reply) {

      User.findByIdAndDelete(request.params.id, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({ message: 'Success.' });
      });
    }
  });

  server.route({
    method: 'PUT',
    path: '/users/{role}/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000'),
          role: Joi.string().valid(...(DefaultScopes))
        }
      },
      pre: [{
        assign: 'canChangeRoles',
        method: function (request, reply){

          User.highestRole(request.auth.credentials.user.roles) >= User.highestRole({ [request.params.role]: true }) ?
            reply(true) :
            reply(Boom.conflict('Unable to promote a higher access level than your own'));
        }
      },{
        assign: 'notYou',
        method: function (request, reply) {

          request.auth.credentials.user._id === request.params.id ?
            reply(Boom.conflict('Unable to promote yourself')) :
            reply(true);
        }
      },{
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              reply(err);
            }

            if (!user) {
              reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;
      if (request.params.role in DefaultScopes){
        reply(user);
      }

      request.params.role === 'clinician' ?
        user.roles.clinician = Clinician.create([]) :
        user.roles[request.params.role] = true;

      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        err ?
          reply(err) :
          reply({
            _id: updatedUser._id,
            username: updatedUser.username,
            roles: updatedUser.roles
          });
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/users/{role}/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000'),
          role: Joi.string().valid(...(DefaultScopes))
        }
      },
      pre: [{
        assign: 'canChangeRoles',
        method: function (request, reply){

          User.highestRole(request.auth.credentials.user.roles) >= User.highestRole({ [request.params.role]: true }) ?
            reply(true) :
            reply(Boom.conflict('Unable to demote a higher access level than your own'));
        }
      },{
        assign: 'notYou',
        method: function (request, reply) {

          request.auth.credentials.user._id === request.params.id ?
            reply(Boom.conflict('Unable to promote yourself')) :
            reply(true);
        }
      },{
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              reply(err);
            }

            if (!user) {
              reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;

      !request.params.role in DefaultScopes ?
        reply(user) :
        delete user.roles[request.params.role];

      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        err ?
          reply(err) :
          reply({
            _id: updatedUser._id,
            username: updatedUser.username,
            roles: updatedUser.roles
          });
      });
    }
  });

  server.route({
    method: 'PUT',
    path: '/users/scopes',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      pre: [{
        assign: 'canChangeScope',
        method: function (request, reply) {

          User.highestRole(request.auth.credentials.user.roles) >= User.highestRole({ [request.params.role]: true }) ?
            reply(true) :
            reply(Boom.conflict('Unable to change higher scope permissions than your role'));
        }
      }]
    },
    handler: function (request, reply) {


      //update scope of route
      const scopeArray = PermissionConfigTable[request.payload.method][request.payload.path];
      if (scopeArray.includes(request.payload.scope)) {
        scopeArray.splice(scopeArray.indexOf(request.payload.scope), 1);
      }
      else {
        scopeArray.push(request.payload.scope);
      }
      Async.auto({
        updateRouteScopeTable: function (callback) {

          RouteScope.findByPathAndMethod(request.payload.path, request.payload.method, (err, routeData) => {

            if (err) {
              callback(err, null);
            }
            if (routeData) {
              RouteScope.updateScope(request.payload.path, request.payload.method, { $set: { scope: scopeArray } });
              callback(null, 'Route Scope Updated');
            }
            else {
              const newRouteData = {
                method: request.payload.method,
                path: request.payload.path,
                scope: scopeArray
              };
              RouteScope.insert(newRouteData);
              callback(null, 'New Route Scope was Created in DB with updated Scopes');
            }
          });
        },
        updatePermissionConfig: function (callback) {

          try {
            if (!PermissionConfigFile.hasOwnProperty(request.payload.method)) {
              PermissionConfigFile[request.payload.method] = {};
            }
            PermissionConfigFile[request.payload.method][request.payload.path] = scopeArray;
            Fs.writeFileSync('server/permission-config.json', JSON.stringify(PermissionConfigFile, null, 2));
            callback(null, 'Config file updated successfully');
          }
          catch (err) {
            console.error(err);
            callback(err);
          }
        }
      }, (err, result) => {

        if (err){
          return reply(Boom.conflict(err));
        }
        if (result) {
          console.log(result);
          return reply({ id: 'routeTable', scopeArray });
        }
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/users/scopeCheck',
    config: {
      auth: {
        strategy: 'session',
        scope: ScopeArray('/scopes', 'GET', DefaultScopes)
      }
    },
    handler: function (request, reply){

      console.log(request.payload.updatedScope);
      Async.auto({
        checkConfigurableScope: function (results, callback) {//checks for hard coded values for the scope of the route definition
          //pass these set of routes (which have different scopes in the data base collection and routing table of the server) to the UI template.
          for (const item of server.table()[0].table) {
            if (item.hasOwnProperty('path')) {//processing routes in server
              const path = item.path;
              const method = item.method.toUpperCase();
              if (path === request.payload.path && method === request.payload.method) {
                const set = new Set();
                request.payload.updatedScope.forEach((role) => {

                  set.add(role);
                });
                let configurableScope = true;
                //TODO: On update of route scopes, still can't distinguish the Unconfigurable routes on reload
                //TODO: When unconfigurable route exist, delete from the top table and insert into the bottom table in Routes & Scopes
                //TODO: Figure out the reload of the HTML page.
                //TODO: make datatable reflect whats in the server.table

                item.settings.auth.access[0].scope.selection.some((role) => {

                  if (!set.has(role)) {
                    configurableScope = false;
                    console.log('looking at route: ', path, method);
                    console.log('route\'s scope: ', item.settings.auth.access[0].scope.selection);
                    console.log('vs: ', request.payload.updatedScope);
                    callback('Scope is not configurable');
                    return true;//breaking out of the some() loop
                  }
                });
                if (configurableScope) {
                  return callback(null, 'Scope is configurable');
                }
              }
            }
          }
        }
      }, (err, result) => {

        if (err) {
          return reply(Boom.conflict(err));
        }
        if (result) {
          return reply(true);
        }
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
  name: 'users'
};
