'use strict';
const React = require('react');

class BooleanInput extends React.Component {
  constructor (props) {
    super(props);
    this.yesClass = this.props.value?'button is-success is-selected':'button';
    this.noClass = !this.props.value?'button is-danger is-selected':'button';
  }

  render () {
    let view;
    if(this.props.viewOnly) {
      view =
        <div className="field">
          <label className="label">{this.props.field.label?this.props.field.label:this.props.field.key}</label>
          <div className="control">
            <div className="buttons has-addons">
              <span className={this.yesClass}>Yes</span>
              <span className={this.noClass}>No</span>
            </div>
          </div>
        </div>
    } else {
      view = <label className="checkbox">
        <input type="checkbox" key={this.props.field.key} name={this.props.field.key}/>
        <span style={{paddingLeft: '10px'}}>{this.props.field.label?this.props.field.label:this.props.field.key}</span>
      </label>
    }

    return (
      <div>
          {view}
      </div>
    )
  }
}

module.exports = BooleanInput;
