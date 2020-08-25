'use strict';
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');

class GroupAdmin {

  static create(userAccess) {

    return { userAccess };
  }

  static addUser(admin, userId) {

    const objectId = AnchorModel.ObjectID(userId);

    if (admin.userAccess.indexOf(objectId) === -1) {
      admin.userAccess.push(objectId);
    }

    return admin;
  }

  static removeUser(admin, userId) {

    let index = 0;
    for (const id of admin.userAccess) {
      if (id.toString() === userId) {
        admin.userAccess.splice(index, 1);
        return admin;
      }
      index += 1;
    }
    return admin;
  }
}


GroupAdmin.schema = Joi.object({
  userAccess: Joi.array().items(Joi.object()).required()
});


module.exports = GroupAdmin;
