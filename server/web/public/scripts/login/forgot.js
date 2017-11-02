'use strict';
const schema = Joi.object({
  email: Joi.string().email().required(),
});
joiToForm('formFields',schema);

$('#forgot').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'POST',
    url: '/api/login/forgot',
    data: values,
    success: function (result) {
      window.location = '/reset'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
