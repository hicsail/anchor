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
// specify the data
const rowData = [
{make: "Toyota", model: "Celica", price: 35000},
{make: "Ford", model: "Mondeo", price: 32000},
{make: "Porsche", model: "Boxter", price: 72000}
];
const gridOptions = {
columnDefs: columnDefs,
rowData: rowData
};
const gridOptionsString = JSON.stringify(gridOptions)
function gridContents (idname) {
    const idName ='"#' + idname +  '"';
    const eGridDiv = `document.querySelector(${idName})`;
    const objectGrid = 'new agGrid.Grid('+eGridDiv+','+ gridOptionsString +')';
    return {__html: objectGrid};
  }


class Spreadsheet extends React.Component {
  render () {
    return (
      <div>
        <div id={this.props.idName} style={this.props.divStyle} className={this.props.themeClass}></div>
        <script type={"text/javascript"} charSet={"utf-8"} dangerouslySetInnerHTML={gridContents(this.props.idName)}/>
      </div>

    )
  }

}

module.exports = Spreadsheet;
