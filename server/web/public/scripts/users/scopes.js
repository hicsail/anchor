'use strict';

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
  $('#UnconfigurableRouteTable').DataTable({
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

function updateScope(path, scope, method) {
  $.ajax({
    url: '/api/users/scopes',
    type: 'PUT',
    data: {
      method: method,
      path: path,
      scope: scope
    },
    success: function (result) {// trigger the api route that compares between the config file and the server
      //successAlert('Route\'s Scope Updated');
      location.reload();
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
