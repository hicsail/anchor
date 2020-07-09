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

function onCheckboxClicked(cb, scope, path) {
  let role = $(cb).attr("id");
  console.log(path);
  cb.checked ?
    add(role, scope, path).then(result => {
      console.log(result);
      $(cb).prop("checked", !cb.checked);
    }, err => {
      console.error(err);
    }) :
    remove(role, scope, path).then(result => {
      console.log(result);
      $(cb).prop('checked', !cb.checked);
    }, err => {
      console.error(err);
    })
}

async function add(role, scope, path){
  scope.push(role);
  await updateScope(path, scope, 'PUT')
}

async function remove(role, scope, path){
  scope.splice(scope.indexOf(role), 1);
  await updateScope(path, scope, 'DELETE')
}

async function updateScope(path, scope, method) {
  return new Promise( (resolve, reject) => {
    $.ajax({
      url: '/api/users/scopes/' + scope + '/' + path,
      type: method,
      data: {test: 'Louis'},
      success: function (result) {
        successAlert('User Updated');
        resolve(result);
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
        reject(result);
      }
    });
  });
}
