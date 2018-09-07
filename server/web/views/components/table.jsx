'use strict';
const React = require('react');

class Table extends React.Component {

    constructor (props) {
        super(props);
    }

    grid(columnDefs, rows, url) {
        const scriptHtml =`
        // setup the grid after the page has finished loading
        var columnDefs =${JSON.stringify(columnDefs)};
        var rowData = ${JSON.stringify(rows)};
        
        var gridOptions = {
            columnDefs,
            rowData,
            enableColResize: true,
            rowSelection: 'single',
        };
        
        function sizeToFit() {
            gridOptions.api.sizeColumnsToFit();
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            
            var gridDiv = document.querySelector('#grid');
            new agGrid.Grid(gridDiv, gridOptions);
            sizeToFit();
        });`;

        return {__html: scriptHtml};
    }

    render () {
        return (
            <div>
                <div id="grid" className="ag-theme-balham" style={{
                    height: '500px',
                    width: '100%'
                }}/>
                <script type={"text/javascript"}
                    charSet={"utf-8"}
                    dangerouslySetInnerHTML={
                        this.grid(
                            this.props.columns,
                            this.props.rows.data,
                            this.props.url
                        )
                    }/>
            </div>

        );
    }
}

module.exports = Table;
