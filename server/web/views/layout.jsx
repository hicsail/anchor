'use strict';
const React = require('react');


class LayoutView extends React.Component {

    render () {
        return (
            <html>
                <head>
                    <title>{this.props.title}</title>
                    <link rel="stylesheet" href="/public/css/lib/bulma.min.css"/>
                </head>
                <body>
                    {this.props.children}
                </body>
            </html>
        );
    }
}


module.exports = LayoutView;
