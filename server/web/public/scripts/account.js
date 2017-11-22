const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  username: Joi.string().token().lowercase().required(),
});
joiToForm('formFields',schema);
$('#update').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'PUT',
    url: '/api/users/my',
    data: values,
    success: function (result) {
      window.location = '/account';
    },
    fail: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
