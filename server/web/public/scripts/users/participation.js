'use strict';

let userID = '';
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
    ],
    ajax: {
      url: '/api/table/users',
      data: function (d) {
        d.fields = 'username studyID inStudy';
      }
    },
    columns: [
      { data: 'username' },
      {
        data: 'studyID',
        render: function (data, type, row) {
          if (row.studyID) {
            return row.studyID;
          }
          return '<i>No Study ID Assigned</i>';
        }
      },
      {
        data: 'inStudy',
        render: function (data, type, row) {
          if (row.inStudy) {
            return '<h4><span class="badge badge-success">In Study</span></h4>';
          }
          return '<h4><span class="badge badge-danger">Not In Study</span></h4>';
        }
      }

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
      $('#studyID').val(rowData.studyID);
      if (rowData.inStudy) {
        $('#in').prop('checked', true);
        $('#inButton').addClass('active btn-primary').removeClass('btn-light');
        $('#out').prop('checked', false);
        $('#outButton').addClass('btn-light').removeClass('active btn-primary');
      }
      else {
        $('#out').prop('checked', true);
        $('#outButton').addClass('active btn-primary').removeClass('btn-light');
        $('#in').prop('checked', false);
        $('#inButton').addClass('btn-light').removeClass('active btn-primary');
      }
      userID = rowData._id;
    }
  });

  $('#inButton').click(() => {
    $('#in').prop('checked', true);
    $('#inButton').addClass('active btn-primary').removeClass('btn-light');
    $('#out').prop('checked', false);
    $('#outButton').addClass('btn-light').removeClass('active btn-primary');
  });

  $('#outButton').click(() => {
    $('#out').prop('checked', true);
    $('#outButton').addClass('active btn-primary').removeClass('btn-light');
    $('#in').prop('checked', false);
    $('#inButton').addClass('btn-light').removeClass('active btn-primary');
  });

  $('#update').click(() => {
    let inStudy = true;
    if ($('input:radio[name =\'inStudy\']:checked').val() === 'out') {
      inStudy = false;
    }
    const data = {
      studyID: Number($('#studyID').val()),
      inStudy
    };
    $.ajax({
      url: '/api/users/' + userID + '/participation',
      type: 'PUT',
      data,
      success: function (result) {
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  });
});
