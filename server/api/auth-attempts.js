'use strict';
const Boom = require('boom');
const Joi = require('joi');
const User = require('../models/user');
const AuthAttempt = require('../models/auth-attempt');

const register = function (server, options) {
  
};

module.exports = {
  name: 'auth-attempts',
  dependencies: [
    'auth',    
    'hapi-anchor-model'    
  ],
  register
};