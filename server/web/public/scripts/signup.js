'use strict';
const signUpSchema = Joi.object().keys({
  name: Joi.string().required(),
  username: Joi.string().lowercase().invalid('root').required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().required()
});
joiToForm('signUpFormFields',signUpSchema);

$('#signup').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#signupForm').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  if(values['password'] === values['confirmPassword']) {
    delete values['confirmPassword'];
    $.ajax({
      type: 'POST',
      url: '../api/signup',
      data: values,
      success: function (result) {
        window.location = '../';
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  } else {
    errorAlert('Passwords do not match');
  }
});
