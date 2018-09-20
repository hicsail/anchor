'use strict';
const React = require('react');
const Layout = require('../layout.jsx');
const Navbar = require('../components/navbar.jsx');
const Sidebar = require('../components/sidebar.jsx');
const Form = require('../components/form');

class EditView extends React.Component {
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
                                    <form id="editForm">
                                        <div className="box">
                                            <Form schema={this.props.schema} data={this.props.data} viewOnly={false}/>
                                        </div>
                                        <br/>
                                        <input id="edit" className="button is-info" type="submit" value="Submit"/>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <script dangerouslySetInnerHTML={{__html: `const url = '${this.props.url}'`}}/>
                <script src="/public/js/pages/edit.js"/>
            </Layout>
        );
    }
}

module.exports = EditView;
