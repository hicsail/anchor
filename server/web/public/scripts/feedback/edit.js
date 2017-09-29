function update(id,resolved) {

  $.ajax({
    type: 'PUT',
    url: '../api/feedback/' + id,
    data: { resolved },
    success: function (result) {
      window.location = '../feedback'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
