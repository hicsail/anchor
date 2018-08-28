'use strict';
const React = require('react');

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

                </body>
            </html>
        );
    }
}


module.exports = LayoutView;
