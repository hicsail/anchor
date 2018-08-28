'use strict';
const React = require('react');
const divStyle = {
  height: '600px',
  width: '500px'
}

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

// let the grid know which columns and what data to use
const gridOptions = {
columnDefs: columnDefs,
rowData: rowData
};
const gridOptionsString = JSON.stringify(gridOptions)
console.log(JSON.parse(gridOptionsString))

const griddiv = '"#myGrid"'
const eGridDiv = `document.querySelector(${griddiv})`;
const objectGrid = 'new agGrid.Grid('+eGridDiv+','+ gridOptionsString +')';
console.log(objectGrid)

function createMarkup() {
  return {__html: objectGrid};
}

class LayoutView extends React.Component {
    render () {
        return (
            <html>
                <head>
                    <title>{this.props.title}</title>
                      <script src="https://unpkg.com/ag-grid/dist/ag-grid.min.noStyle.js"></script>
                      <link rel="stylesheet" href="https://unpkg.com/ag-grid/dist/styles/ag-grid.css"/>
                      <link rel="stylesheet" href="https://unpkg.com/ag-grid/dist/styles/ag-theme-balham.css"/>
                </head>
                <body>
                    {this.props.children}
                    <hr />
                    <p>
                        <a href="/">Home</a> | <a href="/about">About Us</a>
                    </p>
                    <div id="myGrid" style = {divStyle} className={"ag-theme-balham"}></div>
                    <script type={"text/javascript"} charSet={"utf-8"} dangerouslySetInnerHTML={createMarkup()}/>
                </body>
            </html>
        );
    }
}


module.exports = LayoutView;
