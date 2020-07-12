'use strict';

module.exports = {
  GET : {
    '/account': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/authAttempts': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/backups': ['root', 'admin'],
    '/change-password/{id}': ['root', 'admin'],
    '/clinician': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/dashboard': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/docs': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/docs/css/{path*}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/env': ['root', 'admin'],
    '/events': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/events/name/{name}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/events/user/{userId}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/feedback': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/feedback/{id}': ['root', 'admin'],
    '/forgot': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/invite': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/invite/create': ['root', 'admin', 'researcher', 'clinician'],
    '/invite/edit/{id}': ['root', 'admin'],
    '/invite/{id}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/login': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/logout': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/participation': ['root', 'admin', 'researcher'],
    '/public/{param*}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/reset': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/roles': ['root', 'admin', 'researcher'],
    '/sessions': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/setup': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/signup': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/tokens': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/tokens/create': ['root', 'admin', 'researcher'],
    '/tokens/{id}': ['root', 'admin', 'researcher'],
    '/users': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/users/create': ['root', 'admin', 'researcher'],
    '/users/{id}': ['root', 'admin'],
    '/users/clinicians/{id}': ['root', 'admin'],
    '/api': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/auth-attempts': ['root', 'admin', 'researcher'],
    '/api/auth-attempts/{id}': ['admin'],
    '/api/backups': ['root', 'admin', 'researcher'],
    '/api/backups/refresh': ['root', 'admin'],
    '/api/clinicians': ['root', 'admin', 'researcher'],
    '/api/clinicians/my': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/env': ['root', 'admin'],
    '/api/env/{name}': ['root', 'admin'],
    '/api/events': ['root', 'admin', 'researcher'],
    '/api/events/name/{name}': ['root', 'admin', 'researcher'],
    '/api/events/user/{userId}': ['root', 'admin', 'researcher'],
    '/api/feedback': ['root', 'admin', 'researcher'],
    '/api/feedback/unresolved': ['root', 'admin', 'researcher'],
    '/api/feedback/{id}': ['root', 'admin', 'researcher'],
    '/api/invite': ['root', 'admin', 'researcher'],
    '/api/invite/{id}': ['root', 'admin', 'researcher'],
    '/api/select2/clinicians': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/select2/users': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/sessions': ['root', 'admin', 'researcher'],
    '/api/sessions/my': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/sessions/{id}': ['root', 'admin', 'researcher'],
    '/api/table/auth-attempts': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/table/backups': ['root', 'admin', 'researcher'],
    '/api/table/clinicians': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/table/clinicians/{id}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/table/events': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/table/feedback': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/table/invite': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/table/sessions': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/table/tokens': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/table/users': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/tokens': ['root', 'admin', 'researcher'],
    '/api/users': ['root', 'admin', 'researcher'],
    '/api/users/my': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/users/{id}': ['admin']
  },
  DELETE: {
    '/api/auth-attempts/{id}': ['root','admin'],
    '/api/backups/{id}': ['root','admin'],
    '/api/clinicians/{id}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/clinicians/{userId}/{clinicianId}': ['root', 'admin', 'researcher'],
    '/api/events/{id}': ['root','admin'],
    '/api/feedback/{id}': ['root','admin'],
    '/api/invite/{id}': ['root', 'admin', 'researcher'],
    '/api/sessions/{id}': ['root','admin'],
    '/api/sessions/my/{id}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/tokens/{id}': ['root','admin'],
    '/api/users/{id}': ['root','admin'],
    '/api/users/{role}/{id}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/logout': ['root', 'admin', 'researcher', 'analyst', 'clinician']
  },
  POST: {
    '/setup': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/events/{name}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/env': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/feedback': ['root', 'admin'],
    '/api/invite': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/tokens': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/users': ['root','admin','researcher']
  },
  PUT: {
    '/api/backups/{id}': ['root','admin'],
    '/api/clinicians/{id}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/clinicians/{userId}/{clinicianId}': ['root','admin','researcher'],
    '/api/feedback/{id}': ['root', 'admin', 'researcher'],
    '/api/invite/{id}': ['root', 'admin', 'researcher'],
    '/api/tokens/{id}': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/users/my/password': ['root', 'admin', 'researcher', 'analyst', 'clinician'],
    '/api/users/{id}': ['admin'],
    '/api/users/{id}/participation': ['root', 'admin', 'researcher'],
    '/api/users/{id}/password': ['root','admin'],
    '/api/users/{role}/{id}': ['root', 'admin', 'researcher', 'analyst', 'clinician']
  }
};

