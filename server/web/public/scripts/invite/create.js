'use strict';

const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  description: Joi.string().optional()
});
joiToForm('formFields',schema);

$('#create').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  if(values['password'] === values['confirmPassword']) {
    delete values['confirmPassword'];
    $.ajax({
      type: 'POST',
      url: '/api/invite',
      data: values,
      success: function (result) {
        window.location = '/invite'
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  } else {
    errorAlert('Passwords do not match');
  }
});
