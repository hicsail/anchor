'use strict';

function deleteDoc(id) {
  const button = $('#' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/sessions/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('Session Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}
