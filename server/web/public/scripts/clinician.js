'use strict';
let table;

function updateUserAccess(adminId, roleName) { 
  const users = $('#' + adminId + "_" + roleName).val();
  
  $.ajax({
    type: 'PUT',
    url: '/api/groupAdmins/' + roleName + '/' + adminId,
    data: {users: JSON.stringify(users)},    
    success: function (result) { 
      successAlert('User Access Successfully Updated');     
      //table.ajax.reload();
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

$(document).ready(function() {
  table = $('.table').DataTable({    
    scrollX: true,
    scrollY: '500px',
    scrollCollapse: true,
    lengthChange: false,
    dom: 'Bfrtip',
    buttons: [
      'copy', 'csv', 'excel', 'pdf', 'print','colvis'
    ]    
  });

  $('.userAccess').select2({
    ajax: {
      delay: 250,
      url: '/api/select2/users',
      dataType: 'json',
      processResults: function (data) {
        var results = [];
        for(var i = 0; i < data.results.length; i++) {
          results.push({
            id: data.results[i].username,
            text: data.results[i].name
          })
        }
        data.results = results;
        return data;
      },
      cache: true
    },    
    placeholder: 'Search for a clinicians by name, email or username',    
    minimumInputLength: 1,
  });  
});