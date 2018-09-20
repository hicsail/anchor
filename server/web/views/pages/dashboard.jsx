'use strict';
const React = require('react');
const Layout = require('../layout.jsx');
const Navbar = require('../components/navbar.jsx');
const Sidebar = require('../components/sidebar.jsx');

class DashboardView extends React.Component {
  constructor (props) {
    super(props)
  }
    render () {
        return (
            <Layout projectName={this.props.projectName} pageName={this.props.pageName}>
                <section className="hero is-light" style={{minHeight: '100vh'}}>
                    <div className="hero-head">
                        <Navbar credentials={this.props.credentials}/>
                    </div>
                    <div className="hero-body">
                        <div className="columns">
                            <div className="column is-12-mobile is-3-tablet is-2-desktop">
                                <Sidebar credentials={this.props.credentials} sidebar={this.props.sidebar}/>
                            </div>
                            <div className="column is-9">
                                <div className="container">

                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Layout>
        );
    }
}

module.exports = DashboardView;
