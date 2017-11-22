'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');

class Clinician {

  static create(userAccess) {

    return { userAccess };
  }

  static addUser(clinician, userId) {

    const objectId = MongoModels.ObjectID(userId);

    if (clinician.userAccess.indexOf(objectId) === -1) {
      clinician.userAccess.push(objectId);
    }

    return clinician;
  }

  static removeUser(clinician, userId) {

    let index = 0;
    for (const id of clinician.userAccess) {
      if (id.toString() === userId) {
        clinician.userAccess.splice(index, 1);
        return clinician;
      }
      index += 1;
    }
    return clinician;
  }
}


Clinician.schema = Joi.object({
  userAccess: Joi.array().items(Joi.object()).required()
});


module.exports = Clinician;
