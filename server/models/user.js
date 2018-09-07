'use strict';
const AnchorModel = require('../anchor/anchor-model');
const Assert = require('assert');
const Bcrypt = require('bcrypt');
const Hoek = require('hoek');
const Joi = require('joi');


class User extends AnchorModel {

  static async generatePasswordHash(password) {

    Assert.ok(password, 'Missing pasword arugment.');
    const salt = await (Bcrypt.genSalt(10));
    const hash = await (Bcrypt.hash(password,salt));

    return { password, hash };

  }

  static async create(document) {

    const self = this;

    Assert.ok(document.username, 'Missing username argument');
    Assert.ok(document.password, 'Missing password argument');
    Assert.ok(document.email, 'Missing email argument.');
    Assert.ok(document.name, 'Missing name argument.');

    const passwordHash = await this.generatePasswordHash(document.password);
    document =  new this({
      isActive: true,
      inStudy: true,
      username: document.username.toLowerCase(),
      password: passwordHash.hash,
      email: document.email.toLowerCase(),
      name: document.name,
      roles: []
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


  static findByEmail(email) {

    Assert.ok(email, 'Misisng email argument.');

    const query = { email: email.toLowerCase() };

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
  name: Joi.string().required()
});

User.permissionPayload =  Joi.object({
  permissions: Joi.object()
});

User.columns = [
  { headerName: 'Id', field: '_id' },
  { headerName: 'Name', field: 'name' },
  { headerName: 'Username', field: 'username' },
  { headerName: 'Email', field: 'email' },
  { headerName: 'Created At', field: 'createdAt' }];

User.routes = Hoek.applyToDefaults(AnchorModel.routes, {

  create: {
    auth:true,
    disabled: false,
    payload: User.payload
  },
  update: {
    disabled: false,
    payload: User.payload,
    auth: true
  },
  getAll: {
    disabled: false,
    auth: false
  },
  getMy: {
    disabled: false,
    auth: true
  },
  getId: {
    disabled: false,
    auth: true
  },
  insertMany: {
    disabled: false,
    auth: false,
    payload: User.payload
  },
  delete: {
    disabled: false,
    auth: true
  }

});

User.lookups = [{
  from: require('./role'),
  local: 'roles',
  foreign: '_id',
  as: 'roles',
  operator: '$in'
}];

User.indexes = [
  { key: { username: 1, unique: 1 } },
  { key: { email: 1, unique: 1 } }
];



// ColumnDefs and RowDefs
// User.AuthAttemps = [
//   { HeaderName: 'Name', field: 'name' },
//   { HeaderName: 'Username', field: 'username' },
//   { HeaderName: 'Email', field: 'email' },
//   { HeaderName: 'Roles', field: 'roles' },
//   { HeaderName: '', field: '' }
// ];
//
//
// User.Clinicians = [
//   { HeaderName: 'Name', field: 'name' }
// ];
//
// User.Events = [
//   { HeaderName: 'Username', field: 'username' },
//   { HeaderName: 'Study ID', fields: 'studyID' },
//   { HeaderName: 'Event', fields: 'event' },
//   { HeaderName: 'Time', fields: '' }
// ];
//
// User.Feedback = [
//   { HeaderName: 'Username', field: 'username' },
//   { HeaderName: 'Study ID', field: 'studyID' },
//   { HeaderName: 'Subject', field: '' },
//   { HeaderName: 'Description', field: '' },
//   { HeaderName: 'Comment', field: '' },
//   { HeaderName: 'Resolved', field: '' },
//   { HeaderName: 'Time', field: '' },
//   { HeaderName: 'Edit', field: '' }
// ];
//
// User.Sessions = [
//   { HeaderName: 'Username', field: 'username' },
//   { HeaderName: 'Study ID', field: 'studyID' },
//   { HeaderName: 'IP', field: '' },
//   { HeaderName: 'Browser', field: '' },
//   { HeaderName: 'OS', field: '' },
//   { HeaderName: 'Last Active',field: '' },
//   { HeaderName: 'Created At', field: 'createdAt' }
// ];
//
// User.Users = [
//   { HeaderName: 'Name', field: 'name' },
//   { HeaderName: 'Username', field: 'username' },
//   { HeaderName: 'Email', field: 'email' },
//   { HeaderName: 'Joined Study', field: '' },
//   { HeaderName: 'User Events', field: '' }
// ];

module.exports = User;
