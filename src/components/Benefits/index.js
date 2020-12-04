import React from 'react';
import PropTypes from 'prop-types';
//import axios from 'axios';

import '../ContentPanel/ContentPanel.css';

//import config from '../../config.js';

import FhirTransform from '../../FhirTransform.js';
import { renderEOB, resolveDiagnosisReference, primaryTextValue } from '../../fhirUtil.js';
import { Const, stringCompare, formatKey, shallowEqArray, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Benefits' category if there are matching resources
//
export default class Benefits extends React.Component {

   static catName = 'Benefits';

   static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'
 
   static compareFn(a, b) {
      return stringCompare(Benefits.primaryText(a), Benefits.primaryText(b));
   }

   static code(elt) {
      return elt.data.type;
   }

   static primaryText(elt) {
//      return elt.data.type.coding[0].display;
//      return tryWithDefault(elt, elt => Benefits.code(elt).coding[0].display, Const.unknownValue)
      return primaryTextValue(Benefits.code(elt));
   }

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool,
      showDate: PropTypes.bool
   }

   state = {
      matchingData: null,
      loadingRefs: 0
   }

//   AxiosCancelSource = axios.CancelToken.source();

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, `[*category=${Benefits.catName}]`);
      for (let elt of match) {
 resolveDiagnosisReference(elt, this.context);
      }
      this.setState({ matchingData: match.length > 0 ? match : null });
   }

   componentDidMount() {
      this.setMatchingData();
   }

   componentDidUpdate(prevProps, prevState) {
      if (!shallowEqArray(prevProps.data, this.props.data)) {
 this.setMatchingData();
      }
   }

//   componentWillUnmount() {
//      // Cancel any pending async gets
//      this.AxiosCancelSource.cancel('unmounting');
//   }

   // OLDresolveDiagnosisReference(elt) {
   //    if (isValid(elt, e => e.data.diagnosis[0].diagnosisReference.reference) && !elt.data.diagnosis[0].diagnosisReference.code) {
   //   this.setState({loadingRefs: this.state.loadingRefs+1});
   //   axios.get(config.serverUrl + '/reference/' + encodeURIComponent(elt.provider) + '/' + encodeURIComponent(elt.data.diagnosis[0].diagnosisReference.reference),
   //      { cancelToken: this.AxiosCancelSource.token } )
   //      .then(response => {
   //   // Add the de-referenced data to the diagnosisReference element
   //   elt.data.diagnosis[0].diagnosisReference = Object.assign(elt.data.diagnosis[0].diagnosisReference, response.data);
   //   this.setState({loadingRefs: this.state.loadingRefs-1});
   //      })
   //      .catch(thrown => {
   //   if (!axios.isCancel(thrown)) {
   //      console.log(thrown);
   //      this.setState({loadingRefs: this.state.loadingRefs-1});
   //   }
   //      });
   //    }
   // }

//        <div className='benefits category-container' style={this.props.style}>

   render() {
      let firstRes = this.state.matchingData && this.state.matchingData[0];
      return ( this.state.matchingData &&
       (this.props.isEnabled || this.context.trimLevel===Const.trimNone) && // Don't show this category (at all) if disabled and trim set
       <div className='benefits category-container' style={this.props.style} id={formatKey(firstRes)}>
  { formatContentHeader(this.props.isEnabled, Benefits.catName, firstRes, this.context) }
          <div className='content-body'>
     { this.props.isEnabled && renderEOB(this.state.matchingData, this.context) }
             { this.props.isEnabled && this.state.loadingRefs > 0 && <div className='category-loading'>Loading ...</div> }
          </div>
       </div> );
   }
}
