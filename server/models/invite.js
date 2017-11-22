'use strict';
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');
const User = require('./user');

class Invite extends MongoModels {

  static create(name, email, description, userId, callback) {

    const document = {
      name,
      email,
      description,
      userId,
      status: 'Pending',
      time: new Date(),
      expiredAt: new Date(new Date().getTime() + 1000 * 86400 * 7) //7 days
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }
}


Invite.collection = 'invite';


Invite.schema = Joi.object({
  _id: Joi.object(),
  user: User.payload,
  userId: Joi.string().required(),
  status: Joi.boolean().required(),
  time: Joi.date().required()
});

Invite.payload = Joi.object({
  email: Joi.string().email().lowercase().required(),
  name: Joi.string().required(),
  description: Joi.string().optional()
});


Invite.indexes = [
  { key: { userId: 1 } },
  { key: { status: 1 } }
];


module.exports = Invite;
