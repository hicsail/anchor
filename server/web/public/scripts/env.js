'use strict';

function deleteRow(id) {
  $('#' + id + 'row').remove();
}

function add() {
  const id = Math.floor(Math.random() * (99999 - 1 + 1)) + 1;
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
  const data = $('#env').serialize().split('&');
  const envs = {};
  const newValues = {};
  for (let point of data) {
    point = point.split('=');
    if (point[0].indexOf('.') === -1) {
      envs[point[0]] = point[1];
    }
    else {
      point[0] = point[0].split('.');
      const key = point[0][0];
      if (!newValues[key]) {
        newValues[key] = {};
      }
      if (point[0][1] === 'name') {
        newValues[key].name = point[1];
      }
      else {
        newValues[key].value = point[1];
      }
    }
  }
  for (const envName in newValues) {
    envs[newValues[envName].name] = newValues[envName].value;
  }
  $.ajax({
    type: 'POST',
    url: '/api/env',
    data: envs,
    success: function (result) {
      successAlert(result.message);
    },
    fail: function (result) {
      errorAlert(result.responseJSON.message);
    }
  });
}
