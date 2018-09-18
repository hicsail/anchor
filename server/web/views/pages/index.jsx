'use strict';
const React = require('react');
const Layout = require('../layout.jsx');
const Navbar = require('../components/navbar.jsx');

class HomeView extends React.Component {
  constructor (props) {
    super(props)
  }
    render () {
        return (
            <Layout projectName={this.props.projectName} pageName="Home">
                <section className="hero is-light is-large">
                    <div className="hero-head">
                        <Navbar projectName={this.props.projectName} credentials={this.props.credentials}/>
                    </div>
                    <div className="hero-body">
                        <div className="container has-text-centered">
                            <p className="title">
                                Welcome to the plot device.
                            </p>
                        </div>
                    </div>
                </section>
            </Layout>
        );
    }
}

module.exports = HomeView;
