'use strict';

$('#login').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#loginForm').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  $.ajax({
    type: 'POST',
    url: '../api/login',
    data: values,
    success: function (result) {
      location.reload();
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
