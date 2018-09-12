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
        
        var url = "${this.props.url}";
        var currentPage = ${this.props.rows.pages.current};
        var totalPage = ${this.props.rows.pages.total};
        var pageRange = ${5};

        
        document.addEventListener('DOMContentLoaded', function() {
            
            var gridDiv = document.querySelector('#grid');
            new agGrid.Grid(gridDiv, gridOptions);
            
        });`;

        return {__html: scriptHtml};
    }

    pagination() {
        const pageData = this.props.rows.pages;
        console.log(pageData);

        let previousButton;
        if(pageData.hasPrev) {
            previousButton = <a id="previousButton" className="pagination-previous">Previous</a>
        } else {
            previousButton = <a id="previousButton" disabled className="pagination-previous is-disabled">Previous</a>
        }

        let nextButton;
        if(pageData.hasNext) {
            nextButton = <a id="nextButton" className="pagination-next">Next page</a>
        } else {
            nextButton = <a id="nextButton" disabled className="pagination-next">Next page</a>
        }

        let paginationParent;
        let paginationList = [];
        const pageRange = 5;
        paginationList.push(<li><a id="b1" style={{display: 'none'}} className="pagination-link is-current" aria-label="Goto page 1">1</a></li>);
        paginationList.push(<li><span id="b2" style={{display: 'none'}} className="pagination-ellipsis">&hellip;</span></li>);
        for(let i = 1; i <= pageRange; i++) {
            let style = i <= pageData.total?{}:{display: 'none'};
            let className = 'pagination-link';
            if(i === 1) {
                className += ' is-current';
            }
            paginationList.push(<li><a id={'b' + (i + 2)} style={style} className={className} aria-label={`Goto page ${i}`}>{i}</a></li>);
        }
        let lastStyle = pageData.total > 5?{}:{display: 'none'};
        paginationList.push(<li><span id="b8" style={lastStyle} className="pagination-ellipsis">&hellip;</span></li>);
        paginationList.push(<li><a id="b9" style={lastStyle} className="pagination-link" aria-label={`Goto page ${pageData.total}`}>{pageData.total}</a></li>);

        paginationParent = <ul className="pagination-list">{paginationList}</ul>;
        return (
            <nav className="pagination" role="navigation" aria-label="pagination">
                {previousButton}
                {nextButton}
                {paginationParent}
            </nav>
        )
    }

    render () {
        return (
            <div>
                <div className="box">
                    <div id="grid" className="ag-theme-balham" style={{
                        height: '500px',
                        width: '100%'
                    }}/>
                </div>
                <div className="box">
                    {this.pagination()}
                </div>
                <script type={"text/javascript"}
                        charSet={"utf-8"}
                        dangerouslySetInnerHTML={
                            this.grid(
                                this.props.columns,
                                this.props.rows.data,
                                this.props.url
                            )
                        }/>
                <script type={"text/javascript"} src="/public/js/components/table.js" charSet={"utf-8"}/>
            </div>
        );
    }
}

module.exports = Table;
