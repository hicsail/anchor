'use strict'
const React = require('react')
const http = require('http')

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

// specify the data
const rowDefs = [
{make: "Toyota", model: "Celica", price: 35000},
{make: "Ford", model: "Mondeo", price: 32000},
{make: "Porsche", model: "Boxter", price: 72000}
];
//Test Data for user Data
const columnDefs2 = [
{ headerName: 'User Id', field: '_id' },
{ headerName: 'Created At', field: 'createdAt' },
{ headerName: 'Email', field: 'email' },
{ headerName: 'In Study', field: 'inStudy' },
{ headerName: 'Name', field: 'name' },
{ headerName: 'Username', field: 'username' }
];



// const rowDefs3 = http.get({
//   hostname: 'localhost',
//   port: 9000,
//   path: '/getData',
//   agent: false  // create a new agent just for this one request
// }, (res) => {
//   console.log(res.data)
//   return res
// });

function gridContents (idname,columnData, rowData) {
  const fetch = `
  fetch('/dataRow').then(function(response) {
    console.log(response)
    return response;
  }).then(function(data) {
    console.log(data)
  })`
  const gridOptions = {
    columnDefs: columnData,
    rowData: rowData,
    suppressResize: true
  };
  const gridOptionsString = JSON.stringify(gridOptions)
  const idName ='"#' + idname +  '"';
  const eGridDiv = `document.querySelector(${idName})`;
  const objectGrid = 'new agGrid.Grid('+eGridDiv+','+ gridOptionsString +');';

  return {__html: objectGrid + fetch};
  }


class Spreadsheet extends React.Component {
  constructor (props) {
    super(props)
    
  }
  render () {
    return (
      <div>
        <div id={this.props.idName} style={this.props.divStyle} className={this.props.themeClass}></div>
        <script type={"text/javascript"}
          charSet={"utf-8"}
          dangerouslySetInnerHTML={gridContents(this.props.idName,this.props.columnData, this.props.rowData)}/>
      </div>

    )
  }

}

module.exports = Spreadsheet;
