import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay, primaryTextValue } from '../../fhirUtil.js';
import { Const, stringCompare, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Meds Administration' category if there are matching resources
//
export default class MedsAdministration extends React.Component {

   static catName = 'Meds Administration';
    
   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static compareFn(a, b) {
      return stringCompare(MedsAdministration.primaryText(a), MedsAdministration.primaryText(b));
   }

   static code(elt) {
      return elt.data.code;
   }

   static primaryText(elt) {
//      return elt.data.code.coding[0].display;
//      return tryWithDefault(elt, elt => MedsAdministration.code(elt).coding[0].display, Const.unknownValue);
      return primaryTextValue(MedsAdministration.code(elt));
   }

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool,
      showDate: PropTypes.bool
   }

   state = {
      matchingData: null
   }

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, `[*category=${MedsAdministration.catName}]`);
      this.setState({ matchingData: match.length > 0 ? match.sort(MedsAdministration.compareFn)
						     : null });
   }
    
   componentDidMount() {
      this.setMatchingData();
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.data !== this.props.data) {
	 this.setMatchingData();
      }
   }

   render() {
      return ( this.state.matchingData &&
	       (this.props.isEnabled || this.context.trimLevel===Const.trimNone) &&	// Don't show this category (at all) if disabled and trim set
	       <div className='meds-administration category-container'>
		  { formatContentHeader(this.props.isEnabled, MedsAdministration.catName, this.state.matchingData[0], this.context) }
	          <div className='content-body'>
		     { this.props.isEnabled && renderDisplay(this.state.matchingData, 'Medication', this.context) }
	          </div>
	       </div> );
   }
}
