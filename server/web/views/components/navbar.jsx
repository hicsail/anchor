'use strict';
const React = require('react');

class Navbar extends React.Component {

    constructor (props) {
        super(props);
    }

    render () {
        let endMenu;
        if(this.props.credentials) {
            endMenu = <div className="navbar-end">
                    <a className="navbar-item" href="/">
                        {this.props.credentials.user.name}
                    </a>
                    <a className="navbar-item" href="/logout">
                    Logout
                    </a>
                </div>
        } else {
            endMenu = <div className="navbar-end">
                <a className="navbar-item" href="/login">
                    Login
                </a>
                <a className="navbar-item" href="/signup">
                    Sign Up
                </a>
            </div>
        }
        return (
            <nav className="navbar is-white has-shadow">
                <div className="navbar-brand">
                    <a className="navbar-item" href="https://bulma.io">
                        {this.props.projectName}
                    </a>
                    <div className="navbar-burger burger" data-target="navbar">
                        <span/>
                        <span/>
                        <span/>
                    </div>
                </div>
                <div id="navbar" className="navbar-menu">
                    <div className="navbar-start">
                        <a className="navbar-item" href="/">
                            Home
                        </a>
                    </div>
                    {endMenu}
                </div>
            </nav>
        )
    }
}

module.exports = Navbar;
