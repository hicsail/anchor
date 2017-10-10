'use strict';

const schema = Joi.object().keys({
  password: Joi.string().required().min(8),
  confirmPassword: Joi.string().required().min(8)
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
      url: '../api/users/' + userID +'/password',
      data: values,
      success: function (result) {
        window.location = '../users'
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  } else {
    errorAlert('Passwords do not match');
  }
});
