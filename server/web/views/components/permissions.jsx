'use strict';
const React = require('react');

class Permissions extends React.Component {

    constructor (props) {
        super(props);
        this.permissionGroup = {};
        for(let permission of this.props.permissions) {
            if(!this.permissionGroup[permission.tag]) {
                this.permissionGroup[permission.tag] = [];
            }
            this.permissionGroup[permission.tag].push(permission);
        }
    }

    getMethod(method) {
        switch (method) {
            case 'POST':
            case 'post':
                return (<span className="tag is-success">POST</span>);
            case 'GET':
            case 'get':
                return (<span className="tag is-info">GET</span>);
            case 'PUT':
            case 'put':
                return (<span className="tag is-warning">PUT</span>);
            case 'DELETE':
            case 'delete':
                return (<span className="tag is-danger">DELETE</span>);
            default:
                return (<span className="tag is-light">{method}</span>);
        }
    }

    buildPermissions() {
        let permissionList = [];
        for(let group in this.permissionGroup) {
            let groupPermissions = [];
            for(let permission of this.permissionGroup[group]) {
                groupPermissions.push((
                    <div className="column is-4">
                        <div className="field level">
                            <input id={permission.key} type="checkbox" name={permission.key} className="is-checkradio level-item"/>
                            <label htmlFor={permission.key} className="level-item">
                                <div className="tags has-addons">
                                    {this.getMethod(permission.method)}
                                    <span className="tag">{permission.path}</span>
                                </div>
                            </label>
                        </div>
                    </div>
                ));
            }
            permissionList.push((
                <div>
                    <hr/>
                    <h4 className="title is-4">{group}</h4>
                    <hr/>
                    <div className="columns is-multiline">
                        {groupPermissions}
                    </div>
                </div>
            ))
        }
        return permissionList;
    }

    render() {
        return (
            <div className="box">
                {this.buildPermissions()}
            </div>
        )
    }

}

module.exports = Permissions;
