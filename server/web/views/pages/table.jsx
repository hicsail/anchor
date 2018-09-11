'use strict';
const React = require('react');
const Layout = require('../layout.jsx');
const Navbar = require('../components/navbar');
const Table = require('../components/table');


class TableView extends React.Component {
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
                        <div className="container">
                            <Table
                                url={this.props.table.url}
                                rows={this.props.table.rows}
                                columns={this.props.table.columns}
                            />
                        </div>
                    </div>
                </section>
                <script src="/public/js/pages/table.js"></script>
            </Layout>
        );
    }
}

module.exports = TableView;
