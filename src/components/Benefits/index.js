import React from 'react';
import PropTypes from 'prop-types';
// import axios from 'axios';

import '../ContentPanel/ContentPanel.css';

// import config from '../../config.js';

import FhirTransform from '../../FhirTransform.js';
import { renderEOB, resolveDiagnosisReference, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, formatKey, shallowEqArray, formatContentHeader,
} from '../../util.js';

//
// Display the 'Benefits' category if there are matching resources
//
export default class Benefits extends React.Component {
   static catName = 'Benefits';

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
     showDate: PropTypes.bool,
   }

   state = {
     matchingData: null,
     loadingRefs: 0,
   }

   //   AxiosCancelSource = axios.CancelToken.source();

   setMatchingData() {
     const match = FhirTransform.getPathItem(this.props.data, `[*category=${Benefits.catName}]`);
     for (const elt of match) {
       resolveDiagnosisReference(elt, this.props.legacyResources);
     }
     this.setState({ matchingData: match.length > 0 ? match : null });
   }

   componentDidMount() {
     this.setMatchingData();
   }

   componentDidUpdate(prevProps, _prevState) {
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
   //    this.setState({loadingRefs: this.state.loadingRefs+1});
   //    axios.get(config.serverUrl + '/reference/' + encodeURIComponent(elt.provider) + '/' + encodeURIComponent(elt.data.diagnosis[0].diagnosisReference.reference),
   //        { cancelToken: this.AxiosCancelSource.token } )
   //       .then(response => {
   //     // Add the de-referenced data to the diagnosisReference element
   //     elt.data.diagnosis[0].diagnosisReference = Object.assign(elt.data.diagnosis[0].diagnosisReference, response.data);
   //     this.setState({loadingRefs: this.state.loadingRefs-1});
   //       })
   //       .catch(thrown => {
   //     if (!axios.isCancel(thrown)) {
   //        console.log(thrown);
   //        this.setState({loadingRefs: this.state.loadingRefs-1});
   //     }
   //       });
   //    }
   // }

   //         <div className='benefits category-container' style={this.props.style}>

   render() {
     const firstRes = this.state.matchingData && this.state.matchingData[0];
     const {
       patient, providers, trimLevel,
     } = this.props;
     return (this.state.matchingData
         && (this.props.isEnabled || trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
         && (
         <div className="benefits category-container" style={this.props.style} id={formatKey(firstRes)}>
           { formatContentHeader(this.props.isEnabled, Benefits.catName, firstRes, { patient, trimLevel }) }
           <div className="content-body">
             { this.props.isEnabled && renderEOB(this.state.matchingData, providers) }
             { this.props.isEnabled && this.state.loadingRefs > 0 && <div className="category-loading">Loading ...</div> }
           </div>
         </div>
         ));
   }
}
