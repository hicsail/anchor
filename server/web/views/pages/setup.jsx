'use strict';
const React = require('react');
const Layout = require('../layout.jsx');
const Navbar = require('../components/navbar.jsx');

class SetupView extends React.Component {
    constructor (props) {
        super(props)
    }
    render () {
        return (
            <Layout projectName={this.props.projectName} pageName="Setup">
                <section className="hero is-light is-fullheight">
                    <div className="hero-head">
                        <Navbar credentials={this.props.credentials}/>
                    </div>
                    <div className="hero-body">
                        <div className="container has-text-centered">
                            <div className="column is-4 is-offset-4">
                                <h3 className="title has-text-grey">Root User Creation</h3>
                                <div className="box">
                                    <form>
                                        <div className="field">
                                            <div className="control">
                                                <input className="input is-large" type="email" placeholder="Your Email" id="email"
                                                       autoFocus=""/>
                                            </div>
                                        </div>

                                        <div className="field">
                                            <div className="control">
                                                <input className="input is-large" type="password" id="password"
                                                       placeholder="Your Password"/>
                                            </div>
                                        </div>

                                        <button id="setup" className="button is-block is-info is-large is-fullwidth">Create</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <script src="/public/js/pages/setup.js"></script>
            </Layout>
        );
    }
}

module.exports = SetupView;
