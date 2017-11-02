'use strict';
const schema = Joi.object({
  key: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().required()
});
joiToForm('formFields',schema);

$('#reset').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  delete values.confirmPassword;
  $.ajax({
    type: 'POST',
    url: '/api/login/reset',
    data: values,
    success: function (result) {
      location.reload();
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
