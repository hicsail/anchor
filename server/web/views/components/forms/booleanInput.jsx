'use strict';
const React = require('react');

class BooleanInput extends React.Component {
  constructor (props) {
    super(props);
    this.yesClass = this.props.value?'button is-success is-selected':'button';
    this.noClass = !this.props.value?'button is-danger is-selected':'button';
  }

  render () {
    return (
      <div className="field">
        <label className="label">{this.props.field.label?this.props.field.label:this.props.field.key}</label>
        <div className="control">
          <div className="buttons has-addons">
            <span className={this.yesClass}>Yes</span>
            <span className={this.noClass}>No</span>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = BooleanInput;
