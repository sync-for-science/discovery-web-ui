import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderMedsStatement, primaryTextValue } from '../../fhirUtil.js';
import { Const, stringCompare, formatKey, formatContentHeader, tryWithDefault } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Meds Statement' category if there are matching resources
//
export default class MedsStatement extends React.Component {

   static catName = 'Meds Statement';
       
   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static compareFn(a, b) {
      return stringCompare(MedsStatement.primaryText(a), MedsStatement.primaryText(b));
   }

   static code(elt) {
//      return elt.data.code || elt.data.medicationCodeableConcept;
      return tryWithDefault(elt, elt => elt.data.medicationCodeableConcept, tryWithDefault(elt, elt => elt.data.code, null));
   }

   static primaryText(elt) {
      // if (elt.data.code) {
      // 	 return elt.data.code.coding[0].display;
      // } else if (elt.data.medicationCodeableConcept) {
      // 	 return elt.data.medicationCodeableConcept.coding[0].display;
      // } else {
      // 	 return '';
      // }
//      return tryWithDefault(elt, elt => MedsStatement.code(elt).coding[0].display, Const.unknownValue);
      return primaryTextValue(MedsStatement.code(elt));
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
      let match = FhirTransform.getPathItem(this.props.data, `[*category=${MedsStatement.catName}]`);
      this.setState({ matchingData: match.length > 0 ? match.sort(MedsStatement.compareFn)
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
      let firstRes = this.state.matchingData && this.state.matchingData[0];
      return ( this.state.matchingData &&
       (this.props.isEnabled || this.context.trimLevel===Const.trimNone) &&	// Don't show this category (at all) if disabled and trim set
       <div className='meds-statement category-container' id={formatKey(firstRes)}>
  { formatContentHeader(this.props.isEnabled, MedsStatement.catName, firstRes, this.context) }
          <div className='content-body'>
     { this.props.isEnabled && renderMedsStatement(this.state.matchingData, 'Medication', this.context) }
          </div>
       </div> );
   }
}
