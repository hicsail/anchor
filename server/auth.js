'use strict';
const Async = require('async');
const Config = require('../config');
const Session = require('./models/session');
const Token = require('./models/token');
const User = require('./models/user');

const register = function (server, options) {  

  server.auth.strategy('simple', 'basic', {
    validate: async function (request, username, password) {

      const user = await User.findByCredentials(username, password);
      
      if (!user) {
          return { isValid: false };
      }

      if (!user.isActive) {
        return { isValid: false };
      }

      const sessionId = request.state.AuthCookie._id.toString();
      const sessionKey = request.state.AuthCookie.key;

      const session = await Session.findByCredentials(sessionId, sessionKey);
      
      if (!session) {         
          return { isValid: false };
      }    

      const update = {
        $set: {
          lastActive: new Date()
        }
      };
 
      await Session.findByIdAndUpdate(session._id.toString(), update);

      const credentials = {
        session,
        user,
        scope: Object.keys(user.roles)
      };

      return { credentials, isValid: true };      
    }
  });

  server.auth.strategy('jwt', 'jwt', {
    key: Config.get('/authSecret'),
    verifyOptions: { algorithms: ['HS256'] },
    validate: async function (decoded, request) {     

      const token = await Token.findOne({tokenId: decoded, active: true});

      if (!token) {        
        return { isValid: false };
      }

      if (!token.active) {
        return { isValid: false };
      }

      await Token.findByIdAndUpdate(token._id.toString(), { $set: {lastUsed: new Date()} });

      const user = await User.findById(token.userId);

      if (!user) {
        return { isValid: false };
      }

      if (!user.isActive) {
        return { isValid: false };
      }

      const credentials = {
        token,
        user,
        scoep: Object.keys(user.roles)
      };

      return { credentials, isValid: true };      
    }
  });


  server.auth.strategy('session', 'cookie', {
    password: Config.get('/authSecret'),
    cookie: 'AuthCookie',
    isSecure: false,
    clearInvalid: true,
    keepAlive: true,
    ttl: 60000 * 30, //30 Minutes
    redirectTo: '/login',
    //appendNext: 'returnUrl',
    validateFunc: async function (request, data) {  
        
      const id = data._id;
      const key = data.key;

      const session = await Session.findByCredentials(id, key);

      if (!session) {
        return { valid: false };
      }

      const user = await User.findById(session.userId);

      if (!user) {
        return { valid: false };
      }

      if (!user.isActive) {
        return { valid: false };
      }

      const update = {
        $set: {
          lastActive: new Date()
        }
      };

      await Session.findByIdAndUpdate(session._id.toString(), update);

      const credentials = {
        session,
        user,
        scope: Object.keys(user.roles)        
      };
      console.log("roles", user.roles)
      return { credentials, valid: true };

      
    }
  });
  
};

module.exports = {
  name: 'auth',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'hapi-anchor-model'
  ],
  register,  
};