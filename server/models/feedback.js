'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');

class Feedback extends AnchorModel {

  static async create(doc) {

    Assert.ok(doc.subject,'Missing subject');
    Assert.ok(doc.description, 'Missing description');
    Assert.ok(doc.userId,'Missing userid');

    const document = {
      subject: doc.subject,
      description: doc.description,
      userId: doc.userId,
      resolved: false,
      time: new Date()
    };

    const feedback =  await this.insertOne(document);

    return feedback[0];
  }
}


Feedback.collectionName = 'feedback';


Feedback.schema = Joi.object({
  _id: Joi.object(),
  subject: Joi.string().required(),
  description: Joi.string().required(),
  userId: Joi.string().required(),
  resolved: Joi.boolean().required(),
  time: Joi.date().required()
});

Feedback.routes = Hoek.applyToDefaults(AnchorModel.routes, {
  create: {
    payload: Joi.object({
      subject: Joi.string().required(),
      description: Joi.string().required()
    })
  },
  update: {
    payload: Joi.object({
      subject: Joi.string().required(),
      description: Joi.string().required()
    })
  },
  tableView: {
    outputDataFields: {
      username: { label: 'Username', from: 'user' },
      subject: { label: 'Subject' },
      description: { label: 'Description' },
      resolved: { label: 'Resolved' },
      studyID: { label: 'Study ID', from: 'user' },
      userId: { label: 'User ID' },
      time: { label: 'Time' },
      _id: { label: 'ID', accessRoles: ['admin', 'researcher','root'], invisible: true }
    }
  },
  createView: {
    createSchema: Joi.object({
      subject: Joi.string().required(),
      description: Joi.string().required()
    })
  },
  editView: {
    editSchema: Joi.object({
      subject: Joi.string().required(),
      description: Joi.string().required()
    })
  }
});

Feedback.lookups = [{
  from: require('./user'),
  local: 'userId',
  foreign: '_id',
  as: 'user',
  one: true
}];

Feedback.indexes = [
  { key: { name: 1 } },
  { key: { time: 1 } },
  { key: { userId: 1 } }
];


module.exports = Feedback;
