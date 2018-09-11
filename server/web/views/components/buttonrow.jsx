'use strict';
const React = require('react');
const Layout = require('../layout.jsx');


class ButtonRow extends React.Component {
  constructor (props) {
    super(props)
    this.buttonrow = this.buttonrow.bind(this)
  }

  buttonrow () {
    const content = this.props.tabs.map((tab) =>
       <button  key={tab.id}>
          <a href={tab.route} title={tab.title}> {tab.title} </a>
       </button>
   )
   return (
     <flex> {content} </flex>
   )
  }
    render () {

        return (
              <div>{this.buttonrow()}</div>
        );
    }
}


module.exports = ButtonRow;
