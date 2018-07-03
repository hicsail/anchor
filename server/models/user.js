'use strict';
const Assert = require('assert');
const Bcrypt = require('bcrypt');
const Joi = require('joi');
const MongoModels = require('hicsail-mongo-models');


class User extends MongoModels {

  static async generatePasswordHash(password) {

    Assert.ok(password, 'Missing pasword arugment.');
    const salt = await (Bcrypt.genSalt(10));
    const hash = await (Bcrypt.hash(password,salt));

    return { password, hash };

  }

  static async create(username, password, email, name) {

    const self = this;

    Assert.ok(username, 'Missing username argument');
    Assert.ok(password, 'Missing password argument');
    Assert.ok(email, 'Missing email argument.');
    Assert.ok(name, 'Missing name argument.');

    const passwordHash = await this.generatePasswordHash(password);
    const document =  new this({
      isActive: true,
      inStudy: true,
      username: username.toLowerCase(),
      password: passwordHash.hash,
      email: email.toLowerCase(),
      name,
      roles: {},
      studyID: null,
      timeCreated: new Date()
    });

    const users = await self.insertOne(document);

    users[0].password = passwordHash.password;

    return users[0];

  }


  static async findByCredentials(username, password) {

    Assert.ok(username,'Missing username argument.');
    Assert.ok(password,'Missing password argument.');

    const query = { isActive: true };

    if (username.indexOf('@') > -1) {
      query.email = username.toLowerCase();
    }

    else {
      query.username = username.toLowerCase();
    }

    const user = await this.findOne(query);

    if (!user) {
      return;
    }

    const passwordMatch = await Bcrypt.compare(password,user.password);

    if (passwordMatch) {
      return user;
    }

  }


  static findByUsername(username) {

    Assert.ok(username, 'Misisng username argument.');

    const query = { username: username.toLowerCase() };

    return this.findOne(query);
  }



}


User.collectionName = 'users';


User.schema = Joi.object({
  _id: Joi.object(),
  isActive: Joi.boolean().default(true),
  username: Joi.string().token().lowercase().required(),
  password: Joi.string(),
  name: Joi.string(),
  inStudy: Joi.boolean().default(true),
  email: Joi.string().email().lowercase().required(),
  permissions: Joi.object(),
  roles: Joi.array().items(Joi.string()),
  resetPassword: Joi.object({
    token: Joi.string().required(),
    expires: Joi.date().required()
  }),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

User.payload = Joi.object({
  username: Joi.string().token().lowercase().invalid('root').required(),
  password: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  name: Joi.string().required(),
  permissions: Joi.object(),
  roles: Joi.array().items(Joi.string())
});


User.indexes = [
  { key: { username: 1, unique: 1 } },
  { key: { email: 1, unique: 1 } }
];


module.exports = User;
