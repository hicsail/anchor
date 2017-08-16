'use strict';
const User = require('../../../server/models/user');


const user = new User({
    username: 'stimpy',
    roles: {
        clinician: false,
        researcher: false,
        analyst: false,
        admin: true,
        root: false
    }
});


module.exports = {
    user,
    roles: user.roles,
    scope: Object.keys(user.roles)
};
