'use strict'
const React = require('react')
const http = require('http')

function grid(idname,columnData, route) {
  const scriptHtml =`
  // setup the grid after the page has finished loading
  var columnDefs =${JSON.stringify(columnData)}
  var gridOptions = {
    columnDefs: columnDefs,
    pagination: true
  };
  document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#${idname}');
    new agGrid.Grid(gridDiv, gridOptions);
    // do http request to get our sample data - not using any framework to keep the example self contained.
    // you will probably use a framework like JQuery, Angular or something else to do your HTTP calls.
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', '${route}');
    httpRequest.send();
    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4 && httpRequest.status === 200) {
        var httpResult = JSON.parse(httpRequest.responseText);
        gridOptions.api.setRowData(httpResult);
      }
    };
  });`

  return {__html: scriptHtml};
  }


class Spreadsheet extends React.Component {
  constructor (props) {
    super(props)

  }
  render () {
    return (
      <div>
        <div id={this.props.idName}
          style={this.props.divStyle}
          className={this.props.themeClass}>
        </div>
        <script type={"text/javascript"}
          charSet={"utf-8"}
          dangerouslySetInnerHTML={
            grid(
              this.props.idName,
              this.props.columnDefs,
              this.props.dataRoute
            )
          }/>
      </div>

    )
  }

}

module.exports = Spreadsheet;
