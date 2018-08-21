'use strict';
const Fs = require('fs');
const Handlebars = require('handlebars');
const Path = require('path');
const NpmRun = require('npm-run');

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
  data.postPayloads = [];
  data.lowercaseName = data.name.toLowerCase();
  data.dashboardNav = '{{>dashboardNav}}';
  data.endRole = '{{/role}}';
  data.admin = '{{#role user \'admin\'}}';
  data.researcher = '{{#role user \'researcher\'}}';
  data.tableVars = data.tableVars.split(' ');
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
        data.postPayloads.push(variable.trim());
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
  console.log('anchor\tmodel\t\t\t' + data.name + ' Generated');

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
  console.log('anchor\tapi\t\t\t' + data.name + ' Generated');

  //---------------------------
  //model test
  //---------------------------
  const modelTestTemplate = Fs.readFileSync(Path.join(__dirname, './resources/test.model.handlebars'), 'utf8');
  const ModelTest = Handlebars.compile(modelTestTemplate);

  //write to file
  const modelTest = ModelTest(data);
  const modelTestPath = Path.join(__dirname, '../test/server/models/', data.lowercaseName + '.js');
  if (!Fs.existsSync(modelTestPath)) {
    Fs.openSync(modelTestPath, 'wx');
  }
  Fs.writeFileSync(modelTestPath,modelTest);
  console.log('anchor\tmodel test\t\t' + data.name + ' Generated');

  //---------------------------
  //api test
  //---------------------------
  const apiTestTemplate = Fs.readFileSync(Path.join(__dirname, './resources/test.api.handlebars'), 'utf8');
  const ApiTest = Handlebars.compile(apiTestTemplate);

  //write to file
  const apiTest = ApiTest(data);
  const apiTestPath = Path.join(__dirname, '../test/server/api/', data.lowercasePluralName + '.js');
  if (!Fs.existsSync(apiTestPath)) {
    Fs.openSync(apiTestPath, 'wx');
  }
  Fs.writeFileSync(apiTestPath,apiTest);
  console.log('anchor\tapi test\t\t' + data.name + ' Generated');

  //---------------------------
  //web route
  //---------------------------
  const routeTest = Fs.readFileSync(Path.join(__dirname, './resources/route.handlebars'), 'utf8');
  const Route = Handlebars.compile(routeTest);

  //write to file
  const route = Route(data);
  const routePath = Path.join(__dirname, '../server/web/routes/', data.lowercasePluralName + '.js');
  if (!Fs.existsSync(routePath)) {
    Fs.openSync(routePath, 'wx');
  }
  Fs.writeFileSync(routePath,route);
  console.log('anchor\tweb route\t\t' + data.name + ' Generated');

  //---------------------------
  //client side create javascript
  //---------------------------
  const createTemp = Fs.readFileSync(Path.join(__dirname, './resources/create.handlebars'), 'utf8');
  const Create = Handlebars.compile(createTemp);

  //write to file
  const create = Create(data);
  const dir = Path.join(__dirname, '../server/web/public/scripts/', data.lowercasePluralName);
  const createPath = Path.join(__dirname, '../server/web/public/scripts/', data.lowercasePluralName + '/create.js');
  if (!Fs.existsSync(dir)){
    Fs.mkdirSync(dir);
  }
  if (!Fs.existsSync(createPath)) {
    Fs.openSync(createPath, 'wx');
  }
  Fs.writeFileSync(createPath,create);
  console.log('anchor\tclient side create\t' + data.name + ' Generated');

  //---------------------------
  //client side edit javascript
  //---------------------------
  const editTemp = Fs.readFileSync(Path.join(__dirname, './resources/edit.handlebars'), 'utf8');
  const Edit = Handlebars.compile(editTemp);

  //write to file
  const edit = Edit(data);
  const editPath = Path.join(__dirname, '../server/web/public/scripts/', data.lowercasePluralName + '/edit.js');
  if (!Fs.existsSync(editPath)) {
    Fs.openSync(editPath, 'wx');
  }
  Fs.writeFileSync(editPath,edit);
  console.log('anchor\tclient side edit\t' + data.name + ' Generated');

  //---------------------------
  //client side index javascript
  //---------------------------
  const intexTemp = Fs.readFileSync(Path.join(__dirname, './resources/index.handlebars'), 'utf8');
  const Index = Handlebars.compile(intexTemp);

  //write to file
  const index = Index(data);
  const indexPath = Path.join(__dirname, '../server/web/public/scripts/', data.lowercasePluralName + '/index.js');
  if (!Fs.existsSync(indexPath)) {
    Fs.openSync(indexPath, 'wx');
  }
  Fs.writeFileSync(indexPath,index);
  console.log('anchor\tclient side index\t' + data.name + ' Generated');

  //---------------------------
  //client side index html
  //---------------------------
  const indexHtmlTemp = Fs.readFileSync(Path.join(__dirname, './resources/index.html.handlebars'), 'utf8');
  const IndexHtml = Handlebars.compile(indexHtmlTemp);

  //write to file
  const indexHtml = IndexHtml(data);
  const indexHtmlPath = Path.join(__dirname, '../server/web/templates/', data.lowercasePluralName + '/index.handlebars');
  const dirTemplate = Path.join(__dirname, '../server/web/templates/', data.lowercasePluralName);
  if (!Fs.existsSync(dirTemplate)){
    Fs.mkdirSync(dirTemplate);
  }
  if (!Fs.existsSync(indexHtmlPath)) {
    Fs.openSync(indexHtmlPath, 'wx');
  }
  Fs.writeFileSync(indexHtmlPath,indexHtml);
  console.log('anchor\tindex.html\t\t' + data.name + ' Generated');

  //---------------------------
  //client side create html
  //---------------------------
  const createHtmlTemp = Fs.readFileSync(Path.join(__dirname, './resources/create.html.handlebars'), 'utf8');
  const CreateHtml = Handlebars.compile(createHtmlTemp);

  //write to file
  const createHtml = CreateHtml(data);
  const createHtmlPath = Path.join(__dirname, '../server/web/templates/', data.lowercasePluralName + '/create.handlebars');
  if (!Fs.existsSync(createHtmlPath)) {
    Fs.openSync(createHtmlPath, 'wx');
  }
  Fs.writeFileSync(createHtmlPath,createHtml);
  console.log('anchor\tcreate.html\t\t' + data.name + ' Generated');

  //---------------------------
  //client side edit.html.handlebars html
  //---------------------------
  const editHtmlTemp = Fs.readFileSync(Path.join(__dirname, './resources/edit.html.handlebars'), 'utf8');
  const EditHtml = Handlebars.compile(editHtmlTemp);

  //write to file
  const editHtml = EditHtml(data);
  const editHtmlPath = Path.join(__dirname, '../server/web/templates/', data.lowercasePluralName + '/edit.handlebars');
  if (!Fs.existsSync(editHtmlPath)) {
    Fs.openSync(editHtmlPath, 'wx');
  }
  Fs.writeFileSync(editHtmlPath,editHtml);
  console.log('anchor\tedit.html\t\t' + data.name + ' Generated');

  //fix linting issues
  console.log('Running Linting...');
  NpmRun.execSync('npm run lint-fix',null);
  console.log('Generation Complete');
  console.log('Please add Files to manifest.js before running / committing');
}
