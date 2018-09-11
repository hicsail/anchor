'use strict';
const React = require('react');
const Layout = require('../layout.jsx');
const Navbar = require('../components/navbar');

class LoginView extends React.Component {
    constructor (props) {
        super(props)
    }
    render () {
        return (
            <Layout>
                <section className="hero is-light is-fullheight">
                    <div className="hero-head">
                        <Navbar credentials={this.props.credentials}/>
                    </div>
                    <div className="hero-body">
                        <div className="container has-text-centered">
                            <div className="column is-4 is-offset-4">
                                <h3 className="title has-text-grey">Login</h3>
                                <p className="subtitle has-text-grey">Please login to proceed.</p>
                                <div className="box">
                                    <form>
                                        <div className="field">
                                            <div className="control">
                                                <input className="input is-large" type="text" id="name"
                                                       placeholder="Your Name"/>
                                            </div>
                                        </div>

                                        <div className="field">
                                            <div className="control">
                                                <input className="input is-large" type="text" id="username"
                                                       placeholder="Your Username"/>
                                            </div>
                                        </div>

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

                                        <button id="signup" className="button is-block is-info is-large is-fullwidth">Signup</button>
                                    </form>
                                </div>
                                <p className="has-text-grey">
                                    <a href="/login">Login</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                <script src="/public/js/pages/signup.js"></script>
            </Layout>
        );
    }
}

module.exports = LoginView;
