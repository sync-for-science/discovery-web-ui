import React from 'react';
import PropTypes from 'prop-types';
// import axios from 'axios';

import '../ContentPanel/ContentPanel.css';
// import config from '../../config.js';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay, resolveReasonReference, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, shallowEqArray, formatKey, formatContentHeader, tryWithDefault,
} from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Procedures' category if there are matching resources
//
export default class Procedures extends React.Component {
   static catName = 'Procedures';

   static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

   static compareFn(a, b) {
     return stringCompare(Procedures.primaryText(a), Procedures.primaryText(b));
   }

   static code(elt) {
     //      return elt.data.code;  // SNOMED
     return tryWithDefault(elt, (elt) => elt.data.valueCodeableConcept, tryWithDefault(elt, (elt) => elt.data.code, null));
   }

   static primaryText(elt) {
     //      return elt.data.code.coding[0].display;
     //      return tryWithDefault(elt, elt => Procedures.code(elt).coding[0].display, Const.unknownValue);
     return primaryTextValue(Procedures.code(elt));
   }

   static propTypes = {
     data: PropTypes.array.isRequired,
     isEnabled: PropTypes.bool,
     showDate: PropTypes.bool,
   }

   state = {
     matchingData: null,
     loadingRefs: 0,
   }

   //   AxiosCancelSource = axios.CancelToken.source();

   setMatchingData() {
     const match = FhirTransform.getPathItem(this.props.data, `[*category=${Procedures.catName}]`);
     if (match.length > 0) {
       this.setState({ matchingData: match.sort(Procedures.compareFn) });
       for (const elt of match) {
         resolveReasonReference(elt, this.context);
       }
     } else {
       this.setState({ matchingData: null });
     }
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

   // TODO: Handle multiple reason references per single procedure
   //       Move to fhirUtil.js (with callback for state management)
   // OLDresolveReasonReference(elt) {
   //    if (elt.data.reasonReference && elt.data.reasonReference[0] && !elt.data.reasonReference[0].code) {
   //   this.setState({loadingRefs: this.state.loadingRefs+1});
   //   axios.get(config.serverUrl + '/reference/' + encodeURIComponent(elt.provider) + '/' + encodeURIComponent(elt.data.reasonReference[0].reference),
   //      { cancelToken: this.AxiosCancelSource.token } )
   //      .then(response => {
   //   // Add the de-referenced data to the reasonReference element
   //   elt.data.reasonReference[0] = Object.assign(elt.data.reasonReference[0], response.data);
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

   render() {
     const firstRes = this.state.matchingData && this.state.matchingData[0];
     return (this.state.matchingData
       && (this.props.isEnabled || this.context.trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
       && (
       <div className="procedures category-container" id={formatKey(firstRes)}>
         { formatContentHeader(this.props.isEnabled, Procedures.catName, firstRes, this.context) }
         <div className="content-body">
           { this.props.isEnabled && renderDisplay(this.state.matchingData, 'Procedure', this.context) }
           { this.props.isEnabled && this.state.loadingRefs > 0 && <div className="category-loading">Loading ...</div> }
         </div>
       </div>
       ));
   }
}
