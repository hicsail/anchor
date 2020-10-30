'use strict';

function deleteDoc(id, collectionName) {
  const button = $('#delete_' + id);
  const text = button.text().trim();
  if (text === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/'+collectionName+'/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('Token Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}

function editDoc(id, collectionName) {
  window.location = '/'+collectionName+'/' + id
}
