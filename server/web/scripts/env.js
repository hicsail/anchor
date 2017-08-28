function deleteRow(id) {
  $('#' + id + 'row').remove();
}

function add() {
  var id = Math.floor(Math.random() * (99999 - 1 + 1)) + 1;
  $('#env').append(
    '<div class="row" id="' + id + 'row">\n' +
    '<div class="col-4">\n' +
    '<input type="text" class="form-control" id="' + id + 'label" placeholder="ENV NAME" name="' + id + '.name">' +
    '</div>\n' +
    '<div class="col-6">\n' +
    '<input type="text" class="form-control" id="' + id + '" placeholder="ENV VALUE" name="' + id + '.value">' +
    '</div>\n' +
    '<div class="col-2">\n' +
    '<button class="btn btn-danger" onclick="deleteRow(' + id + ')">Delete</button>\n' +
    '</div>\n' +
    '</div><br>\n'
  );
}

function formatData() {
  var data = $('#env').serialize().split('&');
  var envs = {};
  var newValues = {};
  for (var point of data) {
    point = point.split('=');
    if (point[0].indexOf('.') == -1) {
      envs[point[0]] = point[1];
    } else {
      point[0] = point[0].split('.');
      var key = point[0][0];
      if (!newValues[key]) {
        newValues[key] = {};
      }
      if (point[0][1] == 'name') {
        newValues[key]['name'] = point[1];
      } else {
        newValues[key]['value'] = point[1];
      }
    }
  }
  for (var key in newValues) {
    envs[newValues[key].name] = newValues[key].value;
  }
  $.ajax({
    type: "POST",
    url: '../api/env',
    data: envs,
    success: function (result) {
      successAlert(result.message);
    },
    fail: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
