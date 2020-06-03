'use strict';

const userHasRole = function (user, roleName) {  

  if (user.roles[roleName]){
  	return roleName;  	
  }
  else {
  	return '';
  }
};

module.exports = userHasRole;

