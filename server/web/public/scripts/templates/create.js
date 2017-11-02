'use strict';

const schema = Joi.object({
  name: Joi.string().required()
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
    url: '/api/templates',
    data: values,
    success: function (result) {
      window.location = '../templates'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
