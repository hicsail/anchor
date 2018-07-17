'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');

class Invite extends AnchorModel {
  static async create(document) {


    Assert.ok(document.email, 'Email missing');
    Assert.ok(document.status,'Status missing');

    document = {
      email: document.email,
      status: document.status

    };

    const invite = await this.insertOne(document);
    return invite[0];
  }



}


Invite.schema = Joi.object({
  _id: Joi.object(),
  email: Joi.string().required(),
  userId: Joi.string().required(),
  expiredAt: Joi.date().required(),
  status: Joi.string().valid('Pending','Accepted','Declined','Expired')
});



Invite.payload = Joi.object({
  email: Joi.string().required(),
  status: Joi.string().valid('Pending','Accepted','Declined','Expired')

});

Invite.indexes = [
  { key: { email: 1 }  }
];


module.exports = 'Invite';

