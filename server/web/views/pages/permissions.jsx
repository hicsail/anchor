'use strict';
const React = require('react');
const Layout = require('../layout.jsx');
const Permissions = require('../components/permissions.jsx');

class HomeView extends React.Component {
  constructor (props) {
    super(props)
  }
    render () {
        return (
            <Layout projectName={this.props.projectName} pageName="Home">
                <section className="hero is-light is-large">
                    <div className="hero-body">
                        <Permissions permissions={this.props.permissions}/>
                    </div>
                </section>
            </Layout>
        );
    }
}

module.exports = HomeView;
