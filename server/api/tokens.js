'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Token = require('../models/token');
const User = require('../models/user');

const register  = function (server, options) { 
  
};

module.exports = {
  name: 'tokens',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};