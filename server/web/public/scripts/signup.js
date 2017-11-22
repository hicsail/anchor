'use strict';
const signUpSchema = Joi.object({
  name: Joi.string().required(),
  username: Joi.string().lowercase().invalid('root').required(),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(8).regex(/^[A-Z]+[a-z]+[0-9]+$/, '1 Uppercase, 1 lowercase, 1 number'),
  confirmPassword: Joi.string().required().min(8).regex(/^[A-Z]+[a-z]+[0-9]+$/, '1 Uppercase, 1 lowercase, 1 number')
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
      url: '/api/signup',
      data: values,
      success: function (result) {
        window.location = '/';
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  } else {
    errorAlert('Passwords do not match');
  }
});
