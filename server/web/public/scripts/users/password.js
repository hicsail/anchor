'use strict';

const schema = Joi.object().keys({
  password: Joi.string().required().min(8).regex(/^[A-Z]+[a-z]+[0-9]+$/, 'password')
});
joiToForm('formFields',schema);


/*
$('#change').click((event) => {
  event.preventDefault();
const values = {};
$.each($('#form').serializeArray(), (i, field) => {
  values[field.name] = field.value;
});
$.ajax({
  type: 'POST',
  url: '../api/users',
  data: values,
  success: function (result) {
    window.location = '../users'
  },
  error: function (result) {
    errorAlert(result.responseJSON.message);
  }
});
});
*/
