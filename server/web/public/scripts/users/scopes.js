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
  cb.checked ?
    add(role, scope, path, method) :
    remove(role, scope, path, method);
  $(cb).prop('checked', !cb.checked);
}

function add(role, scope, path, method){
  scope.push(role);
  updateScope(path, scope, method)
}

function remove(role, scope, path, method){
  scope.splice(scope.indexOf(role), 1);
  updateScope(path, scope, method)
}

function updateScope(path, scope, method) {
  console.log(path, scope, method);
  $.ajax({
    url: '/api/users/' + scope + '/' + path + '/' + method,
    type: 'PUT',
    success: function (result) {
      successAlert('Route\'s Scope Updated');
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
