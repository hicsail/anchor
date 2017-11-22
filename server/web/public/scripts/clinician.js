'use strict';
let table;
$(document).ready(function() {
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
      url: '/api/table/clinicians',
      data: function (d) {
        d.fields = 'name';
      }
    },
    columns: [
      {
        data: 'name',
        defaultContent: ''
      },
      {
        data: '_id',
        render: function (data, type, row) {
          return '<button class="btn btn-danger" id="remove' + row._id + '" onclick="remove(\'' + row._id + '\')">Remove Access</button>';
        },
        visible: false
      }
    ]
  });

  $('#clinicians').select2({
    ajax: {
      delay: 250,
      url: '/api/select2/clinicians',
      dataType: 'json',
      processResults: function (data) {
        var results = [];
        for(var i = 0; i < data.results.length; i++) {
          results.push({
            id: data.results[i]._id,
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

  $('#addClinician').click(function () {
    const clinicainId = $('#clinicians').val();
    if(clinicainId) {
      $.ajax({
        type: 'PUT',
        url: '/api/clinicians/' + clinicainId,
        success: function (result) {
          table.ajax.reload();
        },
        error: function (result) {
          errorAlert(result.responseJSON.message);
        }
      });
    }
  });
});

function remove(clinicainId) {
  const button = $('#remove' + clinicainId);
  if (button.text() === 'Remove Access') {
    button.text('Are You Sure?');
  }
  else {
    $.ajax({
      type: 'DELETE',
      url: '/api/clinicians/' + clinicainId,
      success: function (result) {
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  }
}
