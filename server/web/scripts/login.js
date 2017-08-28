$('#login').click(function (event) {
  event.preventDefault();
  var values = {};
  $.each($('#loginForm').serializeArray(), function (i, field) {
    values[field.name] = field.value;
  });
  $.ajax({
    type: "POST",
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
