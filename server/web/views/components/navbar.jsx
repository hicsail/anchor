'use strict';
const React = require('react');

class Navbar extends React.Component {

    constructor (props) {
        super(props);
    }

    endMenu() {
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
        return endMenu;
    }

    render () {
        return (
            <div>
                <nav className="navbar is-white has-shadow" style={{backgroundColor: 'white'}}>
                    <div className="navbar-brand">
                        <a className="navbar-item" href="https://bulma.io">
                            {this.props.projectName}
                        </a>
                        <a role="button" className="navbar-burger" data-target="navMenu" aria-label="menu" aria-expanded="false">
                            <span aria-hidden="true"/>
                            <span aria-hidden="true"/>
                            <span aria-hidden="true"/>
                        </a>
                    </div>
                    <div id="navMenu" className="navbar-menu">
                        <div className="navbar-start">
                            <a className="navbar-item" href="/">
                                Home
                            </a>
                            <a className="navbar-item" href="/dashboard">
                                Dashboard
                            </a>
                        </div>
                        {this.endMenu()}
                    </div>
                </nav>
                <script src="/public/js/components/navbar.js"/>
            </div>
        )
    }
}

module.exports = Navbar;
