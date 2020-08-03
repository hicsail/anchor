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
      method,
      path,
      scope
    },
    success: function (result) {// trigger the api route that compares between the config file and the server
      $.ajax({//API route for comparing the scope for configurability in the config file and in server for the specified route's scope
        url: '/api/users/scopeCheck',
        type: 'GET',
        data: {
          method,
          path,
          scopeArray: result //the newly updated scope array from UI
        },
        success: function (result){
          location.reload();
          successAlert('Route\'s Scope Updated');
        },
        error: function (result){
          errorAlert(result.responseJSON.message);
        }
      })
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });

}
