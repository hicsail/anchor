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

    pagination() {
        const pageData = this.props.rows.pages;
        console.log(pageData);
        let previousButton;

        return (
            <nav className="pagination" role="navigation" aria-label="pagination">

            </nav>
        )
    }

    render () {
        return (
            <div>
                <div id="grid" className="ag-theme-balham" style={{
                    height: '500px',
                    width: '100%'
                }}/>
                {this.pagination()}
                <nav className="pagination" role="navigation" aria-label="pagination">
                    <a className="pagination-previous">Previous</a>
                    <a className="pagination-next">Next page</a>
                    <ul className="pagination-list">
                        <li>
                            <a className="pagination-link" aria-label="Goto page 1">1</a>
                        </li>
                        <li>
                            <span className="pagination-ellipsis">&hellip;</span>
                        </li>
                        <li>
                            <a className="pagination-link" aria-label="Goto page 45">45</a>
                        </li>
                        <li>
                            <a className="pagination-link is-current" aria-label="Page 46" aria-current="page">46</a>
                        </li>
                        <li>
                            <a className="pagination-link" aria-label="Goto page 47">47</a>
                        </li>
                        <li>
                            <span className="pagination-ellipsis">&hellip;</span>
                        </li>
                        <li>
                            <a className="pagination-link" aria-label="Goto page 86">86</a>
                        </li>
                    </ul>
                </nav>
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
