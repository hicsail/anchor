'use strict';
const Fs = require('fs');
const Handlebars = require('handlebars');
const Path = require('path');

const command = process.argv[2];
const name = process.argv[3];
const path = process.argv[4];

if (!command || !name || !path) {
  console.error('Missing Command, Name, or Path');
  process.exit(-1);
}

switch (command) {
case 'generate':
case 'g':
  //---------------------------
  //model
  //---------------------------
  const data = require(Path.join(__dirname,path).toString())[name];
  const modelSource = Fs.readFileSync(Path.join(__dirname, './resources/model.handlebars'), 'utf8');
  const Model = Handlebars.compile(modelSource);

  //create variable names
  data.createPayload = '';
  data.createPayloads = [];
  data.createVariables = [];
  data.putPayloads = [];
  const lines = data.schema.split('\n');
  for (let i = 2; i < lines.length - 1; ++i) {
    const variable = lines[i].split(':')[0];

    if (!data.defaultValues[variable.trim()]) {
      data.createPayload += variable.trim() + ', ';

      data.createVariables.push(variable.trim() + ',');

      if (variable.trim() === 'userId') {
        data.createPayloads.push('request.auth.credentials.user._id.toString(), ');
      }
      else {
        data.createPayloads.push('request.payload.' + variable.trim() + ', ');
        data.putPayloads.push(variable.trim() + ': request.payload.' + variable.trim() + ', ');
      }
    }
    else {
      data.createVariables.push(variable.trim() + ': ' + data.defaultValues[variable.trim()] + ',');
    }
  }

  data.createVariables[data.createVariables.length - 1] = data.createVariables[data.createVariables.length - 1].slice(0,-1);

  //collection
  data.lowercasePluralName = data.pluralName.toLowerCase();

  //write to file
  const model = Model(data);
  const modelPath = Path.join(__dirname, '../server/models/', data.name.toLowerCase() + '.js');
  if (!Fs.existsSync(modelPath)) {
    Fs.openSync(modelPath, 'wx');
  }
  Fs.writeFileSync(modelPath,model);
  console.log('anchor\tmodel\t' + data.name + ' Generated');

  //---------------------------
  //api
  //---------------------------
  const apiSource = Fs.readFileSync(Path.join(__dirname, './resources/api.handlebars'), 'utf8');
  const Api = Handlebars.compile(apiSource);

  //write to file
  const api = Api(data);
  const apiPath = Path.join(__dirname, '../server/api/', data.lowercasePluralName + '.js');
  if (!Fs.existsSync(apiPath)) {
    Fs.openSync(apiPath, 'wx');
  }
  Fs.writeFileSync(apiPath,api);
  console.log('anchor\tapi\t' + data.name + ' Generated');
}
