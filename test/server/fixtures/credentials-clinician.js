'use strict';
const User = require('../../../server/models/user');

const user = new User({
    username: 'stimpy',
    roles: {
        clinician: { userAccess:['userId'] },
        analyst: null,
        researcher: null,
        systemAdmin: null
    }
});


module.exports = {
    user,
    roles: user._roles,
    scope: Object.keys(user.roles)
};



module.exports = {
    user,
    roles: user._roles,
    scope: Object.keys(user.roles)
};
