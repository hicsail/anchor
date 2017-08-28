var userID = "";
$(document).ready(function () {
  var table = $('#userTable').DataTable({
    "processing": true,
    "serverSide": true,
    "scrollX": true,
    "stateSave": true,
    "ajax": {
      "url": "../api/users",
      "data": function (d) {
        d.fields = "username studyID inStudy";
      }
    },
    "columns": [
      {"data": "username"},
      {
        "data": "studyID",
        "render": function (data, type, row) {
          if (row.studyID) {
            return row.studyID;
          }
          return '<i>No Study ID Assigned</i>';
        },
      },
      {
        "data": "inStudy",
        "render": function (data, type, row) {
          if (row.inStudy) {
            return '<h4><span class="badge badge-success">In Study</span></h4>';
          }
          return '<h4><span class="badge badge-danger">Not In Study</span></h4>';
        },
      },

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
      var rowData = table.row(this).data();
      $('#roleCard').show();
      $('#username').text(rowData.username);
      $('#studyID').val(rowData.studyID);
      if (rowData.inStudy) {
        $('#in').prop("checked", true);
        $('#inButton').addClass('active btn-primary').removeClass('btn-light');
        $('#out').prop("checked", false);
        $('#outButton').addClass('btn-light').removeClass('active btn-primary');
      } else {
        $('#out').prop("checked", true);
        $('#outButton').addClass('active btn-primary').removeClass('btn-light');
        $('#in').prop("checked", false);
        $('#inButton').addClass('btn-light').removeClass('active btn-primary');
      }
      userID = rowData._id;
    }
  });

  $('#inButton').click(function () {
    $('#in').prop("checked", true);
    $('#inButton').addClass('active btn-primary').removeClass('btn-light');
    $('#out').prop("checked", false);
    $('#outButton').addClass('btn-light').removeClass('active btn-primary');
  });

  $('#outButton').click(function () {
    $('#out').prop("checked", true);
    $('#outButton').addClass('active btn-primary').removeClass('btn-light');
    $('#in').prop("checked", false);
    $('#inButton').addClass('btn-light').removeClass('active btn-primary');
  });

  $('#update').click(function () {
    var inStudy = true;
    if ($("input:radio[name ='inStudy']:checked").val() == 'out') {
      inStudy = false;
    }
    var data = {
      studyID: Number($('#studyID').val()),
      inStudy: inStudy
    };
    $.ajax({
      url: "../api/users/" + userID + "/participation",
      type: 'PUT',
      data: data,
      success: function (result) {
        table.ajax.reload();
      },
      error: function (result) {
        errorAlert(result.responseJSON.message);
      }
    });
  });
});
