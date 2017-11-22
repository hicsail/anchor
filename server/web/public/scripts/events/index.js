'use strict';

function viewEvent() {
  window.location.href = window.location.href.split('/').slice(0,-1).join('/')+'/events/name/' + $('#eventName').val();
}

function deleteDoc(id) {
  const button = $('#' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/events/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('Event Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}
