'use strict';

const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  description: Joi.string().optional()
});
joiToForm('formFields',schema);

$('#update').click((event) => {
  const inviteID = window.location.pathname.split('/').pop();
  event.preventDefault();
  const values = {};
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'PUT',
    url: '/api/invite/' + inviteID,
    data: values,
    success: function (result) {
      window.location = '/invite'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
