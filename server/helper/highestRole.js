'use strict';
const Config = require('../../config');

module.exports =  (roles) => {

  let hm = roles;
  if (Array.isArray(roles)){
    hm = {};
    roles.forEach((role) => {

      hm[role] = true;
    });
  }

  let maxAccessLevel = 0;
  const roleDict = {};

  Config.get('/roles').forEach((roleObj) => {

    roleDict[roleObj.name] = roleObj.accessLevel;
  });

  for (const role in hm) {

    if (roleDict[role] >= maxAccessLevel) {
      maxAccessLevel = roleDict[role];
    }
  }

  return maxAccessLevel;
};
