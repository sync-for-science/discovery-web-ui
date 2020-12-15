import React from 'react';

// import './Providers.css';
import '../../css/Selector.css';

//
// Render the DiscoveryApp provider filter section
//
export default class Providers extends React.Component {

   render() {
      return (
   <div className='selector-set'>
      { this.props.children }
   </div>
      )
   }
}
