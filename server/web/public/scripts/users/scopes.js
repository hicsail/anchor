'use strict';

$(document).ready(() => {
  $('.table').DataTable({
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

window.onload = () => {//after refresh on scope update, get localStorage message for modal
  const msg = localStorage.getItem('scopeUpdated');
  if(msg){
    localStorage.removeItem('scopeUpdated');
    successAlert(msg);
  }
}

$('a[data-toggle="tab"]').on('shown.bs.tab', function(e){
  $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
});

function onCheckboxClicked(cb, scope, path, method, role) {
  updateScope(path, role, method);
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
        type: 'POST',
        data: {
          method,
          path
        },
        success: function (result){
          localStorage.setItem('scopeUpdated', result);
          location.reload();
        },
        error: function (result){
          localStorage.setItem('scopeError', result.responseJSON.message);
          errorAlert(result.responseJSON.message);
        }
      })
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });

}
