'use strict';

const schema = Joi.object().keys({
  name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  username: Joi.string().token().lowercase().invalid('root').required(),
  password: Joi.string().required(),
});
joiToForm('formFields',schema);

$('#create').click((event) => {
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
