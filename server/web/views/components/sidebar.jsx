'use strict';
const React = require('react');

class Sidebar extends React.Component {

    constructor (props) {
        super(props);
        this.state = {
            models: []
        };
        const permissions = this.props.credentials.permissions;
        for(let model of this.props.sidebar) {
            if(!model.disabled) {
                const key = `GET-api-${model.collectionName}`;
                if(!permissions[key]) {
                    this.state.models.push(model);
                } else {
                    if(permissions[key] === true) {
                        this.state.models.push(model);
                    }
                }
            }
        }
    }

    collectionList() {
        let itemList = [];

        for (let model of this.state.models) {
            itemList.push(<li><a className="sidebar-item" href={`/view/${model.collectionName}`}>{model.name}</a></li>)
        }
        return itemList;
    }

    render () {
        return (
            <div>
                <aside className="menu">
                    <p className="menu-label">
                        Collections
                    </p>
                    <ul className="menu-list">
                        {this.collectionList()}
                    </ul>
                </aside>
                <script src="/public/js/components/sidebar.js"/>
            </div>
        )
    }

}

module.exports = Sidebar;
