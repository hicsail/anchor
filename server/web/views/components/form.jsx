'use strict';
const React = require('react');
const TextInput = require('./forms/textInput.jsx');
const BooleanInput = require('./forms/booleanInput.jsx');


class Form extends React.Component {
  constructor (props) {
    super(props)
  }

  build(children) {
      let fields = [];
      for(let key in children) {
          let field = children[key];
          field.key = key;
          const value = this.props.data && this.props.data[field.key]?this.props.data[field.key]:null;
          switch (field.type) {
              case 'date':
              case 'string':
                  fields.push(<TextInput viewOnly={this.props.viewOnly} field={field} value={value}/>);
                  break;
              case 'boolean':
                  fields.push(<BooleanInput viewOnly={this.props.viewOnly} field={field} value={this.props.data[field.key]}/>);
          }
      }
      return fields;
  }

  render () {
    return (
      <div>
        <form>
            {this.build(this.props.schema.children)}
        </form>
      </div>
    )
  }
}

module.exports = Form;
