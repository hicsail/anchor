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
      //TODO: Create API route for comparing the scope in the config file and in server for the specified route's scope.
      location.reload(); //TODO: move to second ajax call on success
      // successAlert('Route\'s Scope Updated');
      console.log('hi');
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
