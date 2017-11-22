'use strict';

const schema = Joi.object({
  tokenName: Joi.string().required()
});
joiToForm('formFields',schema);

$('#activeLabel').click(() => {
  $('#activeLabel').addClass('btn-success').removeClass('btn-secondary');
  $('#inactiveLabel').addClass('btn-secondary').removeClass('btn-danger');
});
$('#inactiveLabel').click(() => {
  $('#activeLabel').addClass('btn-secondary').removeClass('btn-success');
  $('#inactiveLabel').addClass('btn-danger').removeClass('btn-secondary');
});

$('#update').click((event) => {
  event.preventDefault();
  const values = {};
  const tokenID = window.location.pathname.split('/').pop();
  $.each($('#form').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  if(values['active'] == "true") {
    values['active'] = true;
  } else {
    values['active'] = false;
  }
  $.ajax({
    type: 'PUT',
    url: '/api/tokens/' + tokenID,
    data: values,
    success: function (result) {
      window.location = '/tokens'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
