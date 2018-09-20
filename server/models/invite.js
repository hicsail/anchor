'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');
class Invite extends AnchorModel {
  static async create(document) {

    Assert.ok(document.username, 'Username missing');
    Assert.ok(document.email, 'Email missing');
    Assert.ok(document.name, 'Name missing');
    Assert.ok(document.userId, 'User Id missing');

    document = {
      username: document.username,
      email: document.email,
      name: document.name,
      roles: document.roles,
      permissions: document.permissions,
      userId: document.userId,
      status: 'Pending'
    };

    const invite = await this.insertOne(document);
    return invite[0];
  }
}

Invite.collectionName = 'invites';

Invite.schema = Joi.object({
  _id: Joi.object(),
  username: Joi.string().lowercase(), //suggested username of invitee
  email: Joi.string().email().lowercase().required(), //email of person to invite
  name: Joi.string(), //invitee name
  roles: Joi.array(),
  permissions: Joi.object(),
  userId: Joi.string(), // inviter userId
  expiredAt: Joi.date(),
  status: Joi.string().valid('Pending','Accepted','Declined','Expired'),
  invitedUser: Joi.string(),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

Invite.payload = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  roles: Joi.array(),
  permissions: Joi.object()
});

Invite.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    disabled: true
  },
  update: {
    disabled: true
  }
});

Invite.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true
},{
  from: require('./role'),
  local: 'roles',
  foreign: '_id',
  as: 'roles',
  operator: '$in'
}];

Invite.sidebar = {
  name: 'Invites'
};

Invite.columns = [
  {
    headerName: 'Invite',
    children: [
      { headerName: 'Id', field: '_id' },
      { headerName: 'Roles', field: 'roles' },
      { headerName: 'Permissions', field: 'permissions' },
      { headerName: 'Expires At', field: 'expiredAt' },
      { headerName: 'Status', field: 'status' },
      { headerName: 'Created At', field: 'createdAt' },
      { headerName: 'Updated At', field: 'updatedAt' },
      { headerName: 'View', field: '_id', cellRenderer: 'buttonCellRenderer' }
    ]
  },
  {
    headerName: 'Invitee',
    children: [
      { headerName: 'Username', field: 'username' },
      { headerName: 'Name', field: 'name' },
      { headerName: 'Email', field: 'email' }
    ]
  },
  {
    headerName: 'Inviter',
    children: [
      { headerName: 'Name', field: 'user.name' },
      { headerName: 'Username', field: 'user.username' },
      { headerName: 'Email', field: 'user.email' }
    ]
  }
];

Invite.indexes = [
  { key: { email: 1 }  }
];

module.exports = Invite;
