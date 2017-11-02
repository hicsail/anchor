function update(id,resolved) {

  const comment = $('#comment').val();
  $.ajax({
    type: 'PUT',
    url: '/api/feedback/' + id,
    data: {
      resolved,
      comment
    },
    success: function (result) {
      window.location = '/feedback'
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
