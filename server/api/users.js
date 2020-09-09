'use strict';
const Boom = require('boom');
const Fs = require('fs');
const GroupAdmin = require('../models/group-admin');
const User = require('../models/user');
const Config = require('../../config');
const Joi = require('joi');
const PasswordComplexity = require('joi-password-complexity');
const PermissionConfigTable = require('../permission-config.json');
const RouteScope = require('../models/route-scope');

const register = function (server, options) {

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

      const id = request.params.id.toString();
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

            if (!user) {
              throw Boom.notFound('User not found.');
            }

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

      if (!user) {
        
        throw Boom.notFound('User not found.');
      }

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
        scope: ['analyst']
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

  server.route({
    method: 'PUT',
    path: '/api/users/{role}/{id}',
    options: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000'),
          role: Joi.string().valid(...(Config.get('/roles').map((role) => {

            return role.name;
          })))
        }
      },
      pre: [{
        assign: 'canChangeRoles',
        method: function (request, h){          
          return h.continue;
          /*User.highestRole(request.auth.credentials.user.roles) >= User.highestRole({ [request.params.role]: true }) ?
            reply(true) :
            reply(Boom.conflict('Unable to promote a higher access level than your own'));*/
        }
      },{
        assign: 'notYou',
        method: function (request, h) {
      
          if (request.auth.credentials.user._id === request.params.id)
            throw Boom.conflict('Unable to promote yourself.');

          return h.continue;
        }
      },{
        assign: 'user',
        method: async function (request, h) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          const user = await User.findById(request.params.id, findOptions);

          if (!user) {
              throw Boom.notFound('User not found to promote.');
          }

          return user;         
        }
      }]
    },
    handler: async function (request, h) {

      const user = request.pre.user;     
      const role = Config.get('/roles').find(elem => elem.name === request.params.role);

      if (role['type']  === 'groupAdmin') {
        user.roles[request.params.role] = GroupAdmin.create([]); 
      }
      else {
        user.roles[request.params.role] = true;
      }
      
      const update = {
        $set: {
          roles: user.roles
        }
      };

      const updatedUser = await User.findByIdAndUpdate(request.params.id, update);

      return {
        _id: updatedUser._id,
        username: updatedUser.username,
        roles: updatedUser.roles
      };      
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/users/{role}/{id}',
    options: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000'),
          role: Joi.string().valid(...(Config.get('/roles').map((role) => {

            return role.name;
          })))
        }
      },
      pre: [{
        assign: 'canChangeRoles',
        method: function (request, h){
           return h.continue;
          /*User.highestRole(request.auth.credentials.user.roles) >= User.highestRole({ [request.params.role]: true }) ?
            reply(true) :
            reply(Boom.conflict('Unable to demote a higher access level than your own'));*/
        }
      },{
        assign: 'notYou',
        method: function (request, h) {

          if (request.auth.credentials.user._id === request.params.id)
            throw Boom.conflict('Unable to demote yourself.');

          return h.continue;
        }
      },{
        assign: 'user',
        method: async function (request, h) {

          const findOptions = {
            fields: User.fieldsAdapter('username roles')
          };

          const user = await User.findById(request.params.id, findOptions);

          if (!user) {
            throw Boom.notFound('User not found to promote');
          }
          return user;          
        }
      }]
    },
    handler: async function (request, h) {

      const user = request.pre.user;

      delete user.roles[request.params.role];

      const update = {
        $set: {
          roles: user.roles
        }
      };

      const updatedUser = await User.findByIdAndUpdate(request.params.id, update);

      return {
        _id: updatedUser._id,
        username: updatedUser.username,
        roles: updatedUser.roles
      };      
    }
  });  
};

module.exports = {
  name: 'users',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};