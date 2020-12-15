import React from 'react';

import '../../css/Selector.css';

//
// Render the DiscoveryApp category filter section
//
export default class Categories extends React.Component {

  render() {
    return (
      <div className='selector-set'>
        { this.props.children }
      </div>
    )
  }
}

