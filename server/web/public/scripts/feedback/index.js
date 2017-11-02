'use strict';

function deleteDoc(id) {
  const button = $('#' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/feedback/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('Feedback Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}

function editDoc(id) {
  window.location = '/feedback/' + id
}
