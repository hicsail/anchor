'use strict';
const React = require('react');

class TextInput extends React.Component {
    constructor (props) {
        super(props);
        this.type = 'text';
        if(this.props.field.key === 'password') {
            this.type = 'password';
        }
    }

    render () {
        return (
            <div className="field">
                <label className="label">{this.props.field.label?this.props.field.label:this.props.field.key}</label>
                <div className="control">
                    <input className="input" type={this.type} name={this.props.field.key} id={this.props.field.key}/>
                </div>
            </div>
        )
    }
}

module.exports = TextInput;
