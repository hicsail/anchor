'use strict';
const React = require('react');
const Layout = require('./layout.jsx');
const ButtonColumn = require('./components/buttoncolumn')
const ButtonRow = require('./components/buttonrow')
const Forms = require('./components/forms')
const Spreadsheet = require('./components/spreadsheet')
const User = require('../../models/user')
const fields = [
  {id: 0, title: 'test', route:'/'},
  {id: 1, title: 'test2', route: '/break'},
  {id: 2, title:'button', route: '/test2'}
];
const signup = [
  {id: 0, name: 'username', type: 'text'},
  {id: 1, name: 'password', type: 'password'},
  {id: 2, name: 'email', type: 'email'},
  {id: 3, name: 'name', type: 'text'}
]
const gridDivStyle = {
  height: '500px',
  width: '600px'
}
const rowDefs2 = [
  {_id: '0001', createdAt: '00/00/0000', email: '0001@test.com', inStudy: 'true', name: '0001 test', username: '0001test'},
  {_id: '0010', createdAt: '00/00/0000', email: '0010@test.com', inStudy: 'true', name: '0010 test', username: '0010test'},
  {_id: '0011', createdAt: '00/00/0000', email: '0011@test.com', inStudy: 'true', name: '0011 test', username: '0011test'},
  {_id: '0100', createdAt: '00/00/0000', email: '0100@test.com', inStudy: 'true', name: '0100 test', username: '0100test'},
  {_id: '0101', createdAt: '00/00/0000', email: '0101@test.com', inStudy: 'true', name: '0101 test', username: '0101test'},
  {_id: '0110', createdAt: '00/00/0000', email: '0110@test.com', inStudy: 'true', name: '0110 test', username: '0110test'},
  {_id: '0111', createdAt: '00/00/0000', email: '0001@test.com', inStudy: 'true', name: '0001 test', username: '0001test'},
  {_id: '1000', createdAt: '00/00/0000', email: '0001@test.com', inStudy: 'true', name: '0001 test', username: '0001test'},
  {_id: '1001', createdAt: '00/00/0000', email: '0001@test.com', inStudy: 'true', name: '0001 test', username: '0001test'},
  {_id: '1010', createdAt: '00/00/0000', email: '0001@test.com', inStudy: 'true', name: '0001 test', username: '0001test'},
  {_id: '1011', createdAt: '00/00/0000', email: '0001@test.com', inStudy: 'true', name: '0001 test', username: '0001test'},
  {_id: '1100', createdAt: '00/00/0000', email: '0001@test.com', inStudy: 'true', name: '0001 test', username: '0001test'},

]
const gridId = 'myGrid'
const gridClassName = 'ag-theme-balham'

const columnDefs = User.columnDefs
console.log(columnDefs)

class HomeView extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      data: this.props.data
    }
  }

    render () {

        return (
            <Layout title="Home Page">
                <h1>Welcome to the plot device.</h1>
                <ButtonColumn tabs = {fields} />
                <ButtonRow tabs = {fields} />
                <Forms fields  = {signup} />
                <Spreadsheet idName={gridId} divStyle={gridDivStyle} themeClass={gridClassName} columnData={columnDefs} rowData={rowDefs2}/>
            </Layout>

        );
    }
}



module.exports = HomeView;
