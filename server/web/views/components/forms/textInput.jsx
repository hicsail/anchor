'use strict';
const React = require('react');

class TextInput extends React.Component {
    constructor (props) {
        super(props);
        this.type = 'text';
        this.value = '';
        if(this.props.value) {
            this.value = this.props.value
        }
        if(this.props.field.key === 'password') {
            this.type = 'password';
        } else if(this.props.field.type === 'date') {
            this.type = 'date';
            if(this.value) {
                this.value = new Date(this.value).toISOString().substr(0, 10);
                console.log(this.value)
            } else {
                this.value = 'No Date'
            }
        }
    }

    render () {
        return (
            <div className="field">
                <label className="label">{this.props.field.label?this.props.field.label:this.props.field.key}</label>
                <div className="control">
                    <input className="input" disabled={this.props.viewOnly} type={this.type} name={this.props.field.key} id={this.props.field.key} value={this.value}/>
                </div>
            </div>
        )
    }
}

module.exports = TextInput;
