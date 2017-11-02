'use strict';

let table;
$(document).ready(() => {
  table = $('#table').DataTable({
    processing: true,
    serverSide: true,
    scrollX: true,
    scrollY: '500px',
    scrollCollapse: true,
    lengthChange: false,
    dom: 'Bfrtip',
    buttons: [
      'copy', 'csv', 'excel', 'pdf', 'print','colvis'
    ],
    ajax: {
      url: '/api/table/backups',
      data: function (d) {
        d.fields = 'backupId zip s3 time';
      }
    },
    columns: [
      {
        data: '_id',
        defaultContent: ''
      },
      {
        data: 'backupId',
        defaultContent: ''
      },
      {
        data: 'zip',
        render: function (data, type, row) {
          if (row.zip) {
            return '<span class="badge badge-success">Completed</span>';
          }
          return '<span class="badge badge-danger">Failed</span>';
        }
      },
      {
        data: 'time',
        render: function (data, type, row) {
          const date = new Date(row.time);
          return date.toDateString() + ' ' + date.toLocaleTimeString('en-us');
        }
      },
      {
        data: '_id',
        render: function (data, type, row) {
          return '<button class="btn btn-primary" id="restore' + row._id + '" onclick="restore(\'' + row._id + '\')">Restore</button>';
        },
        visible: false
      },
      {
        data: '_id',
        render: function (data, type, row) {
          return '<button class="btn btn-danger" id="delete' + row._id + '" onclick="deleteDoc(\'' + row._id + '\')">Delete</button>';
        },
        visible: false
      }
    ]
  });
});

function restore(id) {
  const button = $('#restore' + id);
  if (button.text() === 'Restore') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/backups/' + id,
      type: 'PUT',
      success: function (result) {
        successAlert('Backup Restored');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}

function deleteDoc(id) {
  const button = $('#delete' + id);
  if (button.text() === 'Delete') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      url: '/api/backups/' + id,
      type: 'DELETE',
      success: function (result) {
        successAlert('Backup Deleted');
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}

function backup() {
  $.ajax({
    url: '/api/backups',
    type: 'POST',
    success: function (result) {
      successAlert('Backup Created');
      table.ajax.reload();
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}

function clean() {
  $.ajax({
    url: '/api/backups/refresh',
    type: 'GET',
    success: function (result) {
      successAlert('Backup Synced');
      table.ajax.reload();
    },
    error: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
