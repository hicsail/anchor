'use strict';
const React = require('react');
const Layout = require('../layout.jsx');


class Forms extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      value: 'Submit'
    }
    this.handleChange = this.handleChange.bind(this)
    /* this.handleSubmit = this.handleSubmit.bind(this) */
    this.forms = this.forms.bind(this)
  }

  handleSubmit (event) {
    alert('we haven\'t implemented this yet')
    event.preventDefault()
    }

  handleChange (event) {
    this.setState({value: event.target.value})
  }

  forms () {
    const content = this.props.fields.map((field) =>
      <div key={field.id} >
        <label>
          {field.name}
          <input type={field.type} name={field.name} />
        </label>
      </div>

    )
    return (
      <div>
        {content}
      </div>
    )
  }
  render () {
    return (
      <div>
        <form>
          {this.forms()}
          <input type='submit' value={this.state.value} onChange={this.handleChange} />
        </form>
      </div>
    )
  }
}

module.exports = Forms
