'use strict';

function deleteDoc(id) {
  const button = $('#delete' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/invite/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('Invite Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}

function editDoc(id) {
  window.location = '/invite/edit/' + id
}
