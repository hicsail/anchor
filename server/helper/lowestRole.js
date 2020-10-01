'use strict';
const Config = require('../../config');
const highestRole = require('./highestRole');

module.exports = (roles) => {

  let hm = roles;
  if (Array.isArray(roles)){
    hm = {};
    roles.forEach((role) => {

      hm[role] = true;
    });
  }

  const roleDict = {};

  Config.get('/roles').forEach((roleObj) => {

    roleDict[roleObj.name] = roleObj.accessLevel;
  });

  let minAccessLevel = highestRole(roleDict);
  for (const role in hm) {

    if (roleDict[role] <= minAccessLevel) {
      minAccessLevel = roleDict[role];
    }
  }

  return minAccessLevel;
};
