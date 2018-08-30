'use strict'
const React = require('react')

const divStyle = {
  height: '600px',
  width: '500px'
}

const gridclassname = "ag-theme-balham"
const columnDefs = [
{headerName: "Make", field: "make"},
{headerName: "Model", field: "model"},
{headerName: "Price", field: "price"}
];
//console.log(User.AuthAttemps)
//console.log(User.gridCollections.AuthAttemps)

// specify the data
const rowDefs = [
{make: "Toyota", model: "Celica", price: 35000},
{make: "Ford", model: "Mondeo", price: 32000},
{make: "Porsche", model: "Boxter", price: 72000}
];

const columnDefs2 = [
{ headerName: 'User Id', field: '_id' },
{ headerName: 'Created At', field: 'createdAt' },
{ headerName: 'Email', field: 'email' },
{ headerName: 'In Study', field: 'inStudy' },
{ headerName: 'Name', field: 'name' },
{ headerName: 'Username', field: 'username' }
];
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


function gridContents (idname,columnData, rowData) {
  const gridOptions = {
    columnDefs: columnData,
    rowData: rowData,
    suppressResize: true
  };
  const gridOptionsString = JSON.stringify(gridOptions)
  const idName ='"#' + idname +  '"';
  const eGridDiv = `document.querySelector(${idName})`;
  const objectGrid = 'new agGrid.Grid('+eGridDiv+','+ gridOptionsString +')';
  const setRowData = 'gridOptions.api.setRowData(data)'
  return {__html: objectGrid};
  }


class Spreadsheet extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      data: props.data
    }
  }
  render () {
    return (
      <div>
        <div id={this.props.idName} style={this.props.divStyle} className={this.props.themeClass}></div>
        <script type={"text/javascript"}
          charSet={"utf-8"}
          dangerouslySetInnerHTML={gridContents(this.props.idName,this.props.columnData, rowDefs2)}/>
      </div>

    )
  }

}

module.exports = Spreadsheet;
