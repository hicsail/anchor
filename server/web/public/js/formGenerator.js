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
        var template = JoiToFormTemp;
        var data = {
          key,
          schema,
          type: schema._type
        };
        if (key == 'password' || key == 'confirmPassword') {
          data.type = 'password';
        }

        return Mustache.render(template, data);

    }
  }
}

const validate = function(key) {
  let schema = schemas[key];
  let input = document.getElementById('JoiFormInput' + key).value
  const {error} = Joi.validate(input,schema);
  if(error) {
    $('#JoiFormInput' + key).addClass('is-invalid').removeClass('is-valid');
    $('#JoiFormHelp' + key).text(error.message.replace('"value"',camelCaseToWords(key)));
  } else {
    $('#JoiFormInput' + key).addClass('is-valid').removeClass('is-invalid');
    $('#JoiFormHelp' + key).text('');
  }
}

var camelCaseToWords = function(str){
  return str.match(/^[a-z]+|[A-Z][a-z]*/g).map(function(x){
    return x[0].toUpperCase() + x.substr(1).toLowerCase();
  }).join(' ');
};

const JoiToFormTemp = '<div class="form-group">\n' +
    '<label for="joiFormLabel{{key}}">{{key}}</label>\n' +
    '<input type="{{type}}" class="form-control" id="JoiFormInput{{key}}" aria-describedby="{{key}}Help" name="{{key}}" placeholder="Enter {{key}}" onkeyup="validate(\'{{key}}\')">\n' +
    '<small id="JoiFormHelp{{key}}" class="form-text text-danger"></small>\n' +
    '</div>\n';

$(() => {
  $("label[for^='joiFormLabel']").each(function() {
    let key = $(this).html();
    $('#JoiFormInput' + key).attr("placeholder",'Enter ' + camelCaseToWords(key));
    $(this).html(camelCaseToWords($(this).html()));
  });
});
