'use strict';
const Boom = require('boom');
const Clinician = require('../models/group-admin');
const AnchorModel = require('../anchor/anchor-model');
const Joi = require('joi');
const User = require('../models/user');

const register = function (server, options) {

  server.route({
    method: 'GET',
    path: '/api/table/clinicians',
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
        username: { $regex: request.query['search[value]'].toLowerCase() },
        'roles.clinician.userAccess': { $in: [userId] }
      };

      const results  = await User.pagedFind(query, page, limit);

      return {
        draw: request.query.draw,
        recordsTotal: results.data.length,
        recordsFiltered: results.items.total,
        data: results.data          
      };      
    }
  });


  server.route({
    method: 'GET',
    path: '/api/table/clinicians/{id}',
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
        username: { $regex: request.query['search[value]'].toLowerCase() },
        'roles.clinician.userAccess': { $in: [userId] }
      };

      const results  = await User.pagedFind(query, page, limit);

      return {
        draw: request.query.draw,
        recordsTotal: results.data.length,
        recordsFiltered: results.items.total,
        data: results.data          
      };       
    }
  });


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
    path: '/api/clinicians',
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

      const query = {
        'roles.clinician': { $exists: true }
      };
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
    path: '/api/clinicians/my',
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

      const query = {
        'roles.clinician.userAccess': { $in: [userId] }
      };

      const results = await User.pagedFind(query, page, limit);

      return results;      
    }
  });

  //need to parameterized role
  server.route({
    method: 'PUT',
    path: '/api/groupAdmins/{role}/{clinicianId}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      pre: [
        {
          assign: 'admin',
          method: async function (request, h) {

            const user = await User.findById(request.params.clinicianId);

            if (!user) {
              throw Boom.notFound('User not found');
            }

            /*if (!user.roles.clinician) {
              throw Boom.conflict('User is not a clinician');
            }*/

            return user;            
          }
        }
      ]
    },
    handler: async function (request, h) {

      const admin = request.pre.admin;        
      
      admin.roles[request.params.role] = JSON.parse(request.payload['users']);

      const update = {
        $set: {
          roles: admin.roles
        }
      };

      const user = await User.findByIdAndUpdate(request.params.clinicianId, update);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return 'Success';      
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/clinicians/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      pre: [
        {
          assign: 'clinician',
          method: async function (request, h) {

            const user = await User.findById(request.params.id);

            if (!user) {
              throw Boom.notFound('User not found');
            }

            if (!user.roles.clinician) {
              throw Boom.conflict('User is not a clinician');
            }

            return user;            
          }
        }
      ]
    },
    handler: async function (request, h) {

      const clinician = request.pre.clinician;
      const userId = request.auth.credentials.user._id.toString();

      const userAccess = Clinician.removeUser(clinician.roles.clinician, userId);
      clinician.roles.clinician = userAccess;


      const update = {
        $set: {
          roles: clinician.roles
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
    path: '/api/clinicians/{userId}/{clinicianId}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      },
      pre: [
        {
          assign: 'clinician',
          method: async function (request, h) {

            const user = await User.findById(request.params.clinicianId);

            if (!user) {
              throw Boom.notFound('Clinician not found');
            }

            if (!user.roles.clinician) {
              throw Boom.conflict('User is not a clinician');
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

      const clinician = request.pre.clinician;
      const userId = request.pre.user;

      const userAccess = Clinician.addUser(clinician.roles.clinician, userId);
      clinician.roles.clinician = userAccess;


      const update = {
        $set: {
          roles: clinician.roles
        }
      };

      const user = await User.findByIdAndUpdate(request.params.clinicianId, update);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return 'Success';      
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/clinicians/{userId}/{clinicianId}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      },
      pre: [
        {
          assign: 'clinician',
          method: async function (request, h) {

            const user = await User.findById(request.params.clinicianId);

            if (!user) {
              throw Boom.notFound('Clinician not found');
            }

            if (!user.roles.clinician) {
              throw Boom.conflict('User is not a clinician');
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

      const clinician = request.pre.clinician;
      const userId = request.pre.user;

      const userAccess = Clinician.removeUser(clinician.roles.clinician, userId);
      clinician.roles.clinician = userAccess;


      const update = {
        $set: {
          roles: clinician.roles
        }
      };

      const user = await User.findByIdAndUpdate(request.params.clinicianId, update);

      if (!user) {
        throw Boom.notFound('Document not found.');
      }

      return 'Success';     
    }
  }); 
};

module.exports = {
  name: 'clinicians',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};