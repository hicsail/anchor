'use strict';
const loginSchema = Joi.object({
  username: Joi.string().lowercase().required(),
  password: Joi.string().required()
});
const loginSchemaEmail = Joi.object({
  email: Joi.string().lowercase().required(),
  password: Joi.string().required()
});
joiToForm('loginFormFields',loginSchema);
joiToForm('loginFormFieldsEmail',loginSchemaEmail);

$('#login').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#loginForm').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'POST',
    url: '/api/login',
    data: values,
    success: function (result) {
      console.log("is success")
      location.reload();
    },
    error: function (result) {
      console.log("hereeee")
      errorAlert(result.responseJSON.message);
    }
  });
});
