$('[data-toggle="datepicker"]').datepicker();
$('#signup').click(function (event) {
  event.preventDefault();
  var values = {};
  $.each($('#signupForm').serializeArray(), function (i, field) {
    values[field.name] = field.value;
  });
  delete values.confirmpassword;
  values.dob = $('[data-toggle="datepicker"]').datepicker('getDate');
  values.height = Number(values.height);
  values.weight = Number(values.weight);
  $.ajax({
    type: "POST",
    url: '../api/signup',
    data: values,
    success: function (result) {
      window.location = '../'
    },
    fail: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
