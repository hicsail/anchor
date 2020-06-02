'use strict';

$(document).ready(() => {
  const table = $('#userTable').DataTable({
    processing: true,
    serverSide: true,
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
  $('#roleCard').hide();
  $('#userTable tbody').on('click', 'tr', function () {
    if ($(this).hasClass('selected')) {
      $(this).removeClass('selected');
    }
    else {
      table.$('tr.selected').removeClass('selected');
      $(this).addClass('selected');
      const rowData = table.row(this).data();
      $('#roleCard').show();
      $('#username').text(rowData.username);
      if (rowData.roles.analyst) {
        $('#analyst').addClass('btn-danger').removeClass('btn-secondary');
        $('#analyst').text('Demote');
        $('#analyst').unbind('click').click(() => {
          demote(rowData._id, 'analyst');
        });
      }
      else {
        $('#analyst').addClass('btn-secondary').removeClass('btn-danger');
        $('#analyst').text('Promote');
        $('#analyst').unbind('click').click(() => {
          promote(rowData._id, 'analyst');
        });
      }
      if (rowData.roles.clinician) {
        $('#clinician').addClass('btn-danger').removeClass('btn-primary');
        $('#clinician').text('Demote');
        $('#clinician').unbind('click').click(() => {
          demote(rowData._id, 'clinician');
        });
      }
      else {
        $('#clinician').addClass('btn-primary').removeClass('btn-danger');
        $('#clinician').text('Promote');
        $('#clinician').unbind('click').click(() => {
          promote(rowData._id, 'clinician');
        });
      }
      if (rowData.roles.researcher) {
        $('#researcher').addClass('btn-danger').removeClass('btn-info');
        $('#researcher').text('Demote');
        $('#researcher').unbind('click').click(() => {
          demote(rowData._id, 'researcher');
        });
      }
      else {
        $('#researcher').addClass('btn-info').removeClass('btn-danger');
        $('#researcher').text('Promote');
        $('#researcher').unbind('click').click(() => {
          promote(rowData._id, 'researcher');
        });
      }
      if (rowData.roles.admin) {
        $('#admin').addClass('btn-danger').removeClass('btn-info');
        $('#admin').text('Demote');
        $('#admin').unbind('click').click(() => {
          demote(rowData._id, 'admin');
        });
      }
      else {
        $('#admin').addClass('btn-warning').removeClass('btn-danger');
        $('#admin').text('Promote');
        $('#admin').unbind('click').click(() => {
          promote(rowData._id, 'admin');
        });
      }
      if (rowData.roles.root) {
        $('#root').html('<h4><span class="badge badge-dark">Root</span></h4>');
      }
      else {
        $('#root').html('');
      }
    }
  });

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
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
});
