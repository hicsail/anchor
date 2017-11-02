'use strict';

const schema = Joi.object({
  name: Joi.string().required()
});
joiToForm('formFields',schema);

$('#update').click((event) => {
  const documentID = window.location.pathname.split('/').pop();
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'PUT',
    url: '/api/templates/' + documentID,
    data: values,
    success: function (result) {
      window.location = '/templates'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
