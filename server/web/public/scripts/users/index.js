'use strict';

function deleteDoc(id) {
  const button = $('#delete' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/users/' + id,
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

function editDoc(id) {
  window.location = '/users/' + id
}

function viewUserEvent(id) {
  window.location = '/events/user/' + id
}

function viewChangePassword(id) {
  window.location = '/change-password/' + id
}

function viewUserClinicians(id) {
  window.location = '/users/clinicians/' + id
}
