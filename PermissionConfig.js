'use strict';

module.exports = {
  '/roles': ['root', 'admin', 'researcher'],
  '/participation': ['root', 'admin', 'researcher'],
  '/users/create': ['root', 'admin', 'researcher'],
  '/change-password/{id}': ['root', 'admin'],
  '/users/{id}': ['root', 'admin'],
  '/users/clinicians/{id}': ['root', 'admin'],
  'GET/api/users': ['root', 'admin', 'researcher'],
  'GET/api/users/{id}': ['admin'],
  'POST/api/users': ['root','admin','researcher'],
  'PUT/api/users/{id}': ['admin'],
  'PUT/api/users/{id}/participation': ['root', 'admin', 'researcher'],
  'PUT/api/users/{id}/password': ['root','admin'],
  'DELETE/api/users/{id}': ['root','admin']
};

