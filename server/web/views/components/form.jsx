'use strict';
const React = require('react');
const TextInput = require('./forms/textInput.jsx');

class Form extends React.Component {
  constructor (props) {
    super(props)
  }

  build(children) {
      let fields = [];
      for(let key in children) {
          let field = children[key];
          field.key = key;
          switch (field.type) {
              case 'date':
              case 'string':
                  fields.push(<TextInput viewOnly={this.props.viewOnly} field={field} value={this.props.data[field.key]}/>);
                  break;
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
