'use strict';
const React = require('react');

class LayoutView extends React.Component {

    render () {
        return (
            <html>
                <head>
                    <title>{`${this.props.projectName} - ${this.props.pageName}`}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <link rel="stylesheet" href="/public/css/lib/bulma.min.css"/>
                    <link rel="stylesheet" href="/public/css/lib/bulma-checkradio.min.css"/>
                    <link rel="stylesheet" href="/public/css/lib/ag-grid.css"/>
                    <link rel="stylesheet" href="/public/css/lib/ag-theme-balham.css"/>

                    <script src="/public/js/lib/jquery.min.js"></script>
                    <script src="/public/js/lib/ag-grid.min.noStyle.js"></script>
                </head>
                <body>
                    {this.props.children}
                </body>
            </html>
        );
    }
}

module.exports = LayoutView;
