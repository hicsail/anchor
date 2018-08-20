'use strict'

const React = require('react')
const Layout = require('../views/layout.jsx')


class Spreadsheet extends React.Component {
  constructor (props) {
    super(props)
    this.spreadsheet = this.spreadsheet.bind(this);
  }

  spreadsheet () {
    const content = this.props.tabs.map((tab) =>
     <div key={tab.id} >
       <button type={tab.type} value={tab.name}> {tab.name} </button>
     </div>
   )
   return (
     <div> {content} </div>
   )
 };

  render () {
    return (
        <div>{this.spreadsheet()}</div>
    )
  }

}

module.exports = Spreadsheet;
