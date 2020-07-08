'use strict';
const Boom = require('boom');
const Clinician = require('../models/clinician');
const User = require('../models/user');
const Config = require('../../config');
const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');

const register = function (server, options) { 

  server.route({
    method: 'GET',
    path: '/api/table/users',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: async function (request, h) {

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

      const users = await User.pagedFind(query, page, limit);

      return ({
        draw: request.query.draw,
        recordsTotal: users.data.length,
        recordsFiltered: users.items.total,
        data: users.data        
      });      
    }
  });


  server.route({
    method: 'GET',
    path: '/api/select2/users',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        query: {
          term: Joi.string(),
          _type: Joi.string(),
          q: Joi.string()
        }
      }
    },
    handler: async function (request, h) {

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

      const users = await User.pagedFind(query, page, limit);

      return ({
        results: users.data,
        pagination: {
          more: users.pages.hasNext
        }
      });      
    }
  });


  server.route({
    method: 'GET',
    path: '/api/users',
    options: {
      auth: {
        strategies: ['simple', 'session'],
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
    handler: async function (request, h) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      const users = await User.pagedFind(query, page, limit);

      return users;      
    }
  });


  server.route({
    method: 'GET',
    path: '/api/users/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      }
    },
    handler: async function (request, h) {

      const user = await User.findById(request.params.id);

      if (!user) {
          throw Boom.notFound('Document not found.');          
      }

      return user;      
    }
  });


  server.route({
    method: 'GET',
    path: '/api/users/my',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }
    },
    handler: async function (request, h) {

      const id = request.auth.credentials.user._id.toString();
      const fields = User.fieldsAdapter('username email roles');

      const user = await User.findById(id, fields);

      if (!user) {
          throw Boom.notFound('Document not found. That is strange.');          
      }

      return user;       
    }
  });


  server.route({
    method: 'POST',
    path: '/api/users',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      },
      validate: {
        payload: User.payload
      },
      pre: [
        {
          assign: 'usernameCheck',
          method: async function (request, h) {

            const conditions = {
              username: request.payload.username
            };

            const user = await User.findOne(conditions);

            if (user) {
              throw Boom.conflict('Username already in use.');
            }

            return h.continue;            
          }
        }, {
          assign: 'emailCheck',
          method: async function (request, h) {

            const conditions = {
              email: request.payload.email
            };

            const user = await User.findOne(conditions);
            
            if (user) {
              throw Boom.conflict('Email already in use.');
            }

            return h.continue;             
          }
        }, {
          assign: 'passwordCheck',
          method: async function (request, h) {

            const complexityOptions = Config.get('/passwordComplexity');

            try {
              await Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions));
            }
            catch (err) {
              throw Boom.conflict('Password does not meet complexity standards');
            } 

            return h.continue;            
          }
        }]
    },
    handler: async function (request, h) {

      const username = request.payload.username;
      const password = request.payload.password;
      const email = request.payload.email;
      const name = request.payload.name;

      const user = await User.create(username, password, email, name);

      return user;      
    }
  });


  server.route({
    method: 'PUT',
    path: '/api/users/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
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
          method: async function (request, h) {

            const conditions = {
              username: request.payload.username,
              _id: { $ne: User._idClass(request.params.id) }
            };

            const user = await User.findOne(conditions);

            if (user) {
              throw Boom.conflict('Username already in use.');
            }

            return h.continue;            
          }
        }, {
          assign: 'emailCheck',
          method: async function (request, h) {

            const conditions = {
              email: request.payload.email,
              _id: { $ne: User._idClass(request.params.id) }
            };

            const user = await User.findOne(conditions);

            if (user) {
              throw Boom.conflict('Email already in use.');
            }

            return h.continue;            
          }
        }
      ]
    },
    handler: async function (request, h) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          username: request.payload.username,
          email: request.payload.email
        }
      };

      const user = await User.findByIdAndUpdate(id, update);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return user;      
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/users/{id}/participation',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin', 'researcher']
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
    handler: async function (request, h) {

      const id = request.params.id;
      const update = {
        $set: {
          inStudy: request.payload.inStudy,
          studyID: request.payload.studyID
        }
      };

      const user = User.findByIdAndUpdate(id, update);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return user;      
    }
  });


  server.route({
    method: 'PUT',
    path: '/api/users/my',
    options: {
      auth: {
        strategies: ['simple', 'session']
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
          method: async function (request, h) {

            const conditions = {
              username: request.payload.username,
              _id: { $ne: request.auth.credentials.user._id }
            };

            const user = await User.findOne(conditions);

            if (user) {
              throw Boom.conflict('Username already in use.');
            }

            return h.continue;            
          }
        }, {
          assign: 'emailCheck',
          method: async function (request, h) {

            const conditions = {
              email: request.payload.email,
              _id: { $ne: request.auth.credentials.user._id }
            };

            const user = await User.findOne(conditions);

            if (user) {
              throw Boom.conflict('Email already in use.');
            }

            return h.continue;            
          }
        }
      ]
    },
    handler: async function (request, h) {

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

      
      const user = await User.findByIdAndUpdate(id, update, findOptions);

      return user;      
    }
  });


  server.route({
    method: 'PUT',
    path: '/api/users/{id}/password',
    options: {
      auth: {
        strategies: ['simple','session'],
        scope: ['root','admin']
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
          method: async function (request, h) {

            const hash = User.generatePasswordHash(request.payload.password);

            return hash;            
          }
        },{
          assign: 'passwordCheck',
          method: async function (request, h) {

            const complexityOptions = Config.get('/passwordComplexity');

            try {
              await Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions));
            }
            catch (err) {
              throw Boom.conflict('Password does not meet complexity standards');
            } 
            
            return h.continue;
          }
        },{
          assign: 'scopeCheck',
          method: async function (request, h) {

            const id = request.params.id;
            const role = User.highestRole(request.auth.credentials.user.roles);

            const user = await User.findById(id);

            const userRole = User.highestRole(user.roles);
            if (role > userRole) {
              return true;
            }
            else {
              throw Boom.unauthorized('User does not have permission to update this users password');
            }            
          }
        }
      ]
    },
    handler: async function (request, h) {

      const id = request.params.id;
      const update = {
        $set: {
          password: request.pre.password.hash
        }
      };

      const user = await User.findByIdAndUpdate(id, update);

      return user;      
    }
  });


  server.route({
    method: 'PUT',
    path: '/api/users/my/password',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: {
          password: Joi.string().required()
        }
      },
      pre: [{
        assign: 'password',
        method: async function (request, h) {

          const hash = await User.generatePasswordHash(request.payload.password);

          return hash;          
        }
      },{
        assign: 'passwordCheck',
        method: async function (request, h) {

          const complexityOptions = Config.get('/passwordComplexity');

          try {
            await Joi.validate(request.payload.password, new PasswordComplexity(complexityOptions));
          }
          catch (err) {
            throw Boom.conflict('Password does not meet complexity standards');
          } 
            
          return h.continue;          
        }
      }]
    },
    handler: async function (request, h) {

      const id = request.auth.credentials.user._id.toString();
      const update = {
        $set: {
          password: request.pre.password.hash
        }
      };

      const user = await User.findByIdAndUpdate(id, update);

      return user;      
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/users/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      }
    },
    handler: async function (request, h) {

      const user = await User.findByIdAndDelete(request.params.id);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return ({ message: 'Success.' });      
    }
  });

  /*server.route({
    method: 'PUT',
    path: '/users/clinician/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [{
        assign: 'notYou',
        method: function (request, reply) {

          if (request.auth.credentials.user._id === request.params.id) {
            return reply(Boom.conflict('Unable to promote yourself'));
          }

          reply(true);
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;

      if (user.roles.clinician) {
        return reply(user);
      }

      user.roles.clinician = Clinician.create([]);
      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        if (err) {
          return reply(err);
        }

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
    path: '/users/clinician/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [{
        assign: 'notYou',
        method: function (request, reply) {

          if (request.auth.credentials.user._id.toString() === request.params.id) {
            return reply(Boom.conflict('Unable to demote yourself'));
          }
          reply(true);
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;

      if (!user.roles.clinician) {
        return reply(user);
      }

      delete user.roles.clinician;
      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        if (err) {
          return reply(err);
        }

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
    path: '/users/analyst/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [{
        assign: 'notYou',
        method: function (request, reply) {

          if (request.auth.credentials.user._id === request.params.id) {
            return reply(Boom.conflict('Unable to promote yourself'));
          }

          reply(true);
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;

      if (user.roles.analyst) {
        return reply(user);
      }

      user.roles.analyst = true;
      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        if (err) {
          return reply(err);
        }

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
    path: '/users/analyst/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [{
        assign: 'notYou',
        method: function (request, reply) {

          if (request.auth.credentials.user._id.toString() === request.params.id) {
            return reply(Boom.conflict('Unable to demote yourself'));
          }
          reply(true);
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;

      if (!user.roles.analyst) {
        return reply(user);
      }

      delete user.roles.analyst;
      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        if (err) {
          return reply(err);
        }

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
    path: '/users/researcher/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [{
        assign: 'notYou',
        method: function (request, reply) {

          if (request.auth.credentials.user._id === request.params.id) {
            return reply(Boom.conflict('Unable to promote yourself'));
          }

          reply(true);
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;

      if (user.roles.researcher) {
        return reply(user);
      }

      user.roles.researcher = true;
      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        if (err) {
          return reply(err);
        }

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
    path: '/users/researcher/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [{
        assign: 'notYou',
        method: function (request, reply) {

          if (request.auth.credentials.user._id.toString() === request.params.id) {
            return reply(Boom.conflict('Unable to demote yourself'));
          }
          reply(true);
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;

      if (!user.roles.researcher) {
        return reply(user);
      }

      delete user.roles.researcher;
      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        if (err) {
          return reply(err);
        }

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
    path: '/users/admin/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [{
        assign: 'notYou',
        method: function (request, reply) {

          if (request.auth.credentials.user._id === request.params.id) {
            return reply(Boom.conflict('Unable to promote yourself'));
          }

          reply(true);
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;

      if (user.roles.admin) {
        return reply(user);
      }

      user.roles.admin = true;
      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        if (err) {
          return reply(err);
        }

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
    path: '/users/admin/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [{
        assign: 'notYou',
        method: function (request, reply) {

          if (request.auth.credentials.user._id.toString() === request.params.id) {
            return reply(Boom.conflict('Unable to demote yourself'));
          }
          reply(true);
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          User.findById(request.params.id, findOptions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.notFound('User not found to promote'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const user = request.pre.user;

      if (!user.roles.admin) {
        return reply(user);
      }

      delete user.roles.admin;
      const update = {
        $set: {
          roles: user.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, updatedUser) => {

        if (err) {
          return reply(err);
        }

        reply({
          _id: updatedUser._id,
          username: updatedUser.username,
          roles: updatedUser.roles
        });
      });
    }
  });*/  
};

module.exports = {
  name: 'users',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};