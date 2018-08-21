'use strict';
const React = require('react');
const Layout = require('./layout.jsx');
const Navbar = require('./components/navbar');
const ButtonColumn = require('./components/buttoncolumn');
const ButtonRow = require('./components/buttonrow');
const Forms = require('./components/forms');
const fields = [
  {id: 0, title: 'test', route:'/'},
  {id: 1, title: 'test2', route: '/break'},
  {id: 2, title:'button', route: '/test2'}
];
const signup = [
  {id: 0, name: 'username', type: 'text'},
  {id: 1, name: 'password', type: 'password'},
  {id: 2, name: 'email', type: 'email'},
  {id: 3, name: 'name', type: 'text'}
]

class HomeView extends React.Component {

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

                <ButtonColumn tabs = {fields} />
                <ButtonRow tabs = {fields} />
                <Forms fields  = {signup} />
            </Layout>
        );
    }
}



module.exports = HomeView;
