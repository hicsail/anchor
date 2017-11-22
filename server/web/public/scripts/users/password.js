'use strict';

const schema = Joi.object({
  password: Joi.string().required().min(8).regex(/^[A-Z]+[a-z]+[0-9]+$/, '1 Uppercase, 1 lowercase, 1 number'),
  confirmPassword: Joi.string().required().min(8).regex(/^[A-Z]+[a-z]+[0-9]+$/, '1 Uppercase, 1 lowercase, 1 number')
});
joiToForm('formFields', schema);


$('#change').click((event) => {
  const userID = window.location.pathname.split('/').pop();
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  if(values['password'] === values['confirmPassword']) {
    delete values['confirmPassword'];
    $.ajax({
      type: 'PUT',
      url: '/api/users/' + userID +'/password',
      data: values,
      success: function (result) {
        window.location = '/users'
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  } else {
    errorAlert('Passwords do not match');
  }
});
