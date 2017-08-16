'use strict';
const Joi = require('joi');

class Clinician {

    static create(userAccess, callback) {

        Joi.validate(userAccess, Clinician.schema.userAccess, callback);
    }
}


Clinician.schema = Joi.object().keys({
    userAccess: Joi.array().items(Joi.string()).unique().required()
});


module.exports = Clinician;
