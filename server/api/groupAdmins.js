'use strict';
const Boom = require('boom');
const GroupAdmin = require('../models/group-admin');
const AnchorModel = require('../anchor/anchor-model');
const Joi = require('joi');
const User = require('../models/user');
const Config = require('../../config');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/api/table/groupAdmins/{role}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: async function (request, h) {

      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      const fields = request.query.fields;
      const userId = AnchorModel.ObjectID(request.auth.credentials.user._id.toString());

      const query = {
        username: { $regex: request.query['search[value]'].toLowerCase() }        
      };

      var field = "roles." + request.params.role + ".userAccess";
      query[field] = { $in: [userId] };

      const results  = await User.pagedFind(query, page, limit);

      return {
        draw: request.query.draw,
        recordsTotal: results.data.length,
        recordsFiltered: results.items.total,
        data: results.data          
      };      
    }
  });


  /*server.route({
    method: 'GET',
    path: '/api/table/groupAdmins/{role}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: async function (request, h) {

      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      const fields = request.query.fields;
      const userId = MongoModels.ObjectID(request.params.id);

      const query = {
        username: { $regex: request.query['search[value]'].toLowerCase() }        
      };

      var field = "roles." + request.params.role + ".userAccess";
      query[field] = { $in: [userId] };

      const results  = await User.pagedFind(query, page, limit);

      return {
        draw: request.query.draw,
        recordsTotal: results.data.length,
        recordsFiltered: results.items.total,
        data: results.data          
      };       
    }
  });*/


  server.route({
    method: 'GET',
    path: '/api/select2/{role}',
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

      var field = "roles." + request.params.role;
      query[field] = { $exists: true };

      const fields = 'name email username';
      const limit = 25;
      const page = 1;

      const results  = await User.pagedFind(query, page, limit);
      
      return {
        results: results.data,
        pagination: {
          more: results.pages.hasNext
        }        
      };      
    }
  });


  server.route({
    method: 'GET',
    path: '/api/groupAdmins/',
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

      let conditions = [];
      for (let role of Config.get('/roles')) {
        if (role['type'] === 'groupAdmin') {          
          let query = {};
          var field = "roles." + role['name'];
          query[field] = { $exists: true };
          conditions.push(query);
        }
      }

      const query = { $or: conditions};

      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      const results = await User.pagedFind(query, page, limit);

      return results;      
    }
  });


  server.route({
    method: 'GET',
    path: '/api/groupAdmins/my/{role}',
    options: {
      auth: {
        strategies: ['simple', 'session']
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

      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;
      const userId = MongoModels.ObjectID(request.auth.credentials.user._id.toString());

      const query = {};

      var field = "roles." + request.params.role + ".userAccess";
      query[field] = { $in: [userId] };

      const results = await User.pagedFind(query, page, limit);

      return results;      
    }
  });
  
  server.route({
    method: 'PUT',
    path: '/api/groupAdmins/{role}/{adminId}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      pre: [
        {
          assign: 'admin',
          method: async function (request, h) {

            const user = await User.findById(request.params.adminId);

            if (!user) {
              throw Boom.notFound('User not found');
            }

            if (!user.roles[request.params.role]) {
              throw Boom.conflict('User is not a ' + request.params.role);
            }

            return user;            
          }
        }
      ]
    },
    handler: async function (request, h) {

      const admin = request.pre.admin;       
      
      admin.roles[request.params.role].userAccess = JSON.parse(request.payload['users']);

      const update = {
        $set: {
          roles: admin.roles
        }
      };

      const user = await User.findByIdAndUpdate(request.params.adminId, update);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return 'Success';      
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/groupAdmins/{role}/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      pre: [
        {
          assign: 'admin',
          method: async function (request, h) {

            const user = await User.findById(request.params.id);

            if (!user) {
              throw Boom.notFound('User not found');
            }           

            if (!user.roles[request.params.role]) {
              throw Boom.conflict('User is not a ' + request.params.role);
            }

            return user;            
          }
        }
      ]
    },
    handler: async function (request, h) {

      const admin = request.pre.admin;
      const userId = request.auth.credentials.user._id.toString();

      const userAccess = GroupAdmin.removeUser(admin.roles[request.params.role], userId);
      admin.roles[request.params.role] = userAccess;


      const update = {
        $set: {
          roles: admin.roles
        }
      };

      const user = await User.findByIdAndUpdate(request.params.id, update);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return 'Success';      
    }
  });


  server.route({
    method: 'PUT',
    path: '/api/groupAdmins/{role}/{userId}/{adminId}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      },
      pre: [
        {
          assign: 'admin',
          method: async function (request, h) {

            const user = await User.findById(request.params.adminId);

            if (!user) {
              throw Boom.notFound('Admin not found');
            }

            if (!user.roles[request.params.role]) {
              throw Boom.conflict('User is not a ' + request.params.role);
            }

            return user;             
          }
        },{
          assign: 'user',
          method: async function (request, h) {

            const user = await User.findById(request.params.userId);

            if (!user) {
              throw Boom.notFound('User not found');
            }            

            return request.params.userId;             
          }
        }
      ]
    },
    handler: async function (request, h) {

      const admin = request.pre.admin;
      const userId = request.pre.user;

      const userAccess = GroupAdmin.addUser(admin.roles[request.params.role], userId);
      admin.roles[request.params.role] = userAccess;


      const update = {
        $set: {
          roles: admin.roles
        }
      };

      const user = await User.findByIdAndUpdate(request.params.adminId, update);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return 'Success';      
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/groupAdmins/{role}/{userId}/{adminId}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      },
      pre: [
        {
          assign: 'admin',
          method: async function (request, h) {

            const user = await User.findById(request.params.adminId);

            if (!user) {
              throw Boom.notFound('Admin not found');
            }

            if (!user.roles[request.params.role]) {
              throw Boom.conflict('User is not a ' + request.params.role);
            }           

            return user;             
          }
        },{
          assign: 'user',
          method: async function (request, h) {

            const user = await User.findById(request.params.userId);

            if (!user) {
              throw Boom.notFound('User not found');
            }            

            return request.params.userId;            
          }
        }
      ]
    },
    handler: async function (request, h) {

      const admin = request.pre.admin;
      const userId = request.pre.user;

      const userAccess = GroupAdmin.removeUser(admin.roles[request.params.role], userId);
      admin.roles[request.params.role] = userAccess;


      const update = {
        $set: {
          roles: admin.roles
        }
      };

      const user = await User.findByIdAndUpdate(request.params.adminId, update);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return 'Success';     
    }
  }); 
};

module.exports = {
  name: 'groupAdmins',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};