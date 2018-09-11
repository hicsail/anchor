'use strict';
const React = require('react');
const Layout = require('../layout.jsx');
const Navbar = require('../components/navbar.jsx');
const Table = require('../components/table.jsx');


class TableView extends React.Component {
    constructor (props) {
        super(props)
    }

    render () {
        return (
            <Layout projectName={this.props.projectName} pageName={this.props.pageName}>
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
