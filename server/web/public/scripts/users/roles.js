'use strict';

$(document).ready(() => {
  $('#userTable').DataTable({
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

function onCheckboxClicked(cb, id) {
  let userRole = $(cb).attr("id");
  cb.checked?
    promote(id, userRole).catch( err => {
      $(cb).prop("checked", !cb.checked);
    }) :
    demote(id, userRole).catch( err => {
      $(cb).prop('checked', !cb.checked);
    })
}

async function promote(id, role) {
  return new Promise( (resolve, reject) => {
    changeRole(id, role, 'PUT').then(result => {
      resolve(result);
    }, err => {
      reject(err);
    })
  })
}

async function demote(id, role) {
  return new Promise( (resolve, reject) => {
      changeRole(id, role, 'DELETE').then(result => {
        resolve(result);
      }, err => {
        reject(err);
      })
    }
  )
}

async function changeRole(id, role, method) {
  return new Promise( (resolve, reject) => {
    $.ajax({
      url: '/api/users/' + role + '/' + id,
      type: method,
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
