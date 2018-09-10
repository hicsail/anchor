'use strict';
const React = require('react');
const Layout = require('../layout.jsx');
const Navbar = require('../components/navbar');

class HomeView extends React.Component {
  constructor (props) {
    super(props)
  }
    render () {
        return (
            <Layout>
                <section className="hero is-light is-large">
                    <div className="hero-head">
                        <Navbar credentials={this.props.credentials}/>
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
