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

  // $(".roleCheck").click(function(cb){
  //
  //   let role = $(this).attr("id");
  //   if($(this).is(':checked')) {
  //     console.log(cb.target);
  //     console.log("checked!");
  //     // promote(, role);
  //   }
  //   else {
  //     console.log("not checked !")
  //     // demote(, role);
  //   }
  // });
});

function onCheckboxClicked(cb, id) {
  let userRole = $(cb).attr("id");
  if(cb.checked){
    promote(id, userRole);
  }
  else{
    demote(id, userRole);
  }
}

function promote(id, role) {
  changeRole(id, role, 'PUT');
}

function demote(id, role) {
  changeRole(id, role, 'DELETE');
}

function changeRole(id, role, method) {
  $.ajax({
    url: '/api/users/' + role + '/' + id,
    type: method,
    success: function (result) {
      successAlert('User Updated');
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
