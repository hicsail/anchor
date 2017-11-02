var schemas = {};
function joiToForm(id,schema,key='JoiFormTopLevel') {
  if(schema.isJoi) {
    let html = "";
    switch (schema._type) {
      case 'object':
        for (let children of schema._inner.children) {
          html += joiToForm(id, children.schema, children.key);
        }
        if(key == 'JoiFormTopLevel') {
          $('#' + id).html(html);
        } else {
          return html;
        }
      case 'string':
      case 'number':
      case 'date':
        schemas[key] = schema;
        var data = {
          key,
          schema,
          type: schema._type
        };
        if (key == 'password' || key == 'confirmPassword') {
          data.type = 'password';
        }

        return Mustache.render(JoiToFormTemp, data);
      case 'boolean':
        var data = {
          key,
          schema,
          type: schema._type
        };
        return Mustache.render(JoiToFormTempBoolean,data);
    }
  }
}

const validate = function(key) {
  let schema = schemas[key];
  let input = document.getElementById('JoiFormInput' + key).value
  const {error} = Joi.validate(input,schema);
  if(error && key == 'password' || key == 'confirmPassword') {
    $('#JoiFormInput' + key).addClass('is-invalid').removeClass('is-valid');
    var message = error.message.replace('"value"',camelCaseToWords(key));
    if(message.includes('Password with value')){
      message = message.split('"').pop();
    }
    $('#JoiFormHelp' + key).text(message);
  } else if(error) {
    $('#JoiFormInput' + key).addClass('is-invalid').removeClass('is-valid');
    $('#JoiFormHelp' + key).text(error.message.replace('"value"',camelCaseToWords(key)));
  } else {
    $('#JoiFormInput' + key).addClass('is-valid').removeClass('is-invalid');
    $('#JoiFormHelp' + key).text('');
  }
  if(key == 'confirmPassword' && !error) {
    if($('#JoiFormInputconfirmPassword').val() !== $('#JoiFormInputpassword').val()) {
      $('#JoiFormInput' + key).addClass('is-invalid').removeClass('is-valid');
      $('#JoiFormHelp' + key).text('Passwords do not match');
    }
  }
}

const camelCaseToWords = function(str){
  return str.match(/^[a-z]+|[A-Z][a-z]*/g).map(function(x){
    return x[0].toUpperCase() + x.substr(1).toLowerCase();
  }).join(' ');
};

const JoiToFormTemp = '<div class="form-group">\n' +
    '<label for="joiFormLabel{{key}}">{{key}}</label>\n' +
    '<input type="{{type}}" class="form-control" id="JoiFormInput{{key}}" aria-describedby="{{key}}Help" name="{{key}}" placeholder="Enter {{key}}" onkeyup="validate(\'{{key}}\')">\n' +
    '<small id="JoiFormHelp{{key}}" class="form-text text-danger"></small>\n' +
    '</div>\n';

const JoiToFormTempBoolean = '<div class="form-check">\n' +
  '<label class="form-check-label" for="joiFormLabel{{key}}">' +
  '<input type="checkbox" class="form-check-input" id="JoiFormInput{{key}}" name="{{key}}" value="{{key}}" checked>\n' +
  '{{key}}</label>\n' +
  '</div>\n';

$(() => {
  $("label[for^='joiFormLabel']").each(function() {
    let key = $(this).html();
    $('#JoiFormInput' + key).attr("placeholder",'Enter ' + camelCaseToWords(key));
    $(this).html(camelCaseToWords($(this).html()));
  });
});

const joiFormValue = function(key,value) {
  $('#JoiFormInput' + key).val(value);
  validate(key);
}
