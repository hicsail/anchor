'use strict';
// import * as PermissionConfigTable from '../../../../../permission-config';//importing it doesn't work for some reason

$(document).ready(() => {
  $('#routeTable').DataTable({
    scrollX: true,
    scrollY: '500px',
    scrollCollapse: true,
    stateSave: true,
    lengthChange: false,
    dom: 'Bfrtip',
    buttons: [
      'copy', 'csv', 'excel', 'pdf', 'print','colvis'
    ]
  });
});

function onCheckboxClicked(cb, scope, path, method) {
  let role = $(cb).attr("id");
  if (cb.checked) {
    updateScope(path, role, method);
    $(cb).prop('checked', true);
  }
  else {
    updateScope(path, role, method);
    $(cb).prop('checked', false);
  }
}

function updateScope(path, role, method) {
  $.ajax({
    url: '/api/users/scopes',
    type: 'PUT',
    data: {
      method: method,
      path: path,
      role: role
    },
    success: function (result) {
      successAlert('Route\'s Scope Updated');
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
