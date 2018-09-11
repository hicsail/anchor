'use strict';
const React = require('react');
const Layout = require('../layout.jsx');


class ButtonColumn extends React.Component {
  constructor (props) {
    super(props)
    this.buttoncolumn = this.buttoncolumn.bind(this)
  }

  buttoncolumn () {
    const content = this.props.tabs.map((tab) =>
     <div key={tab.id} >
       <button>
          <a href={tab.route} title={tab.title}> {tab.title} </a>
       </button>
     </div>
   )
   return (
     <div> {content} </div>
   )
  }
    render () {

        return (
              <div>{this.buttoncolumn()}</div>
        );
    }
}


module.exports = ButtonColumn;
