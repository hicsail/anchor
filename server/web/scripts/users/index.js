function deleteDoc(id) {
  var button = $('#' + id);
  if(button.text() === 'Delete') {
    button.text('Are You Sure?')
  } else {
    $.ajax({
      url: '../api/users/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('User Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}
