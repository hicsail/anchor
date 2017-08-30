'use strict';

$('[data-toggle="datepicker"]').datepicker();
$(() => {
  switch (gender) {
  case 'male':
    $('#genderMale').prop('checked', true);
    break;
  case 'female':
    $('#genderFemale').prop('checked', true);
    break;
  default:
    $('#genderNull').prop('checked', true);
    break;
  }
});
$('#update').click((event) => {
  event.preventDefault();
  const values = {};
  $.each($('#updateForm').serializeArray(), (i, field) => {
    values[field.name] = field.value;
  });
  values.dob = $('[data-toggle="datepicker"]').datepicker('getDate');
  values.height = Number(values.height);
  values.weight = Number(values.weight);
  $.ajax({
    type: 'PUT',
    url: '../api/users/my',
    data: values,
    success: function (result) {
      window.location = '../account';
    },
    fail: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
});
