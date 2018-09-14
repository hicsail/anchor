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
              case 'string':
                  fields.push(<TextInput field={field}/>);
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
