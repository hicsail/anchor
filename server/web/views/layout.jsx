'use strict';
const React = require('react');
const Navbar = require('./components/navbar');


class LayoutView extends React.Component {

    render () {
        return (
            <html>
                <head>
                    <title>{this.props.title}</title>
                    <link rel="stylesheet" href="/public/css/lib/bulma.min.css"/>
                </head>
                <body>
                    <Navbar context={this.props.context}/>
                    {this.props.children}
                </body>
            </html>
        );
    }
}


module.exports = LayoutView;
