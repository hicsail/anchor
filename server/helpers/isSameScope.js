'use strict';

module.exports = (scope1, scope2) => {//checks if the two scope arrays are the same.

  let isSameScope = false;
  if (scope1.length !== scope2.length){
    return isSameScope;
  }
  const set = new Set();
  scope1.forEach((role) => {

    set.add(role);
  });
  isSameScope = scope2.every((role) => {//if any role is not within the set then return true.

    return set.has(role);
  });
  return isSameScope;
};
