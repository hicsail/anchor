'use strict';

function deleteDoc(id) {
  const button = $('#' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/auth-attempts/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('Auth Attempt Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}
