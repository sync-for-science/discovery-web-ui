import React from 'react';
import PropTypes from 'prop-types';
// import axios from 'axios';

import '../ContentPanel/ContentPanel.css';

// import config from '../../config.js';

import FhirTransform from '../../FhirTransform.js';
import { renderClaims, resolveDiagnosisReference } from '../../fhirUtil.js';
import {
  Const, stringCompare, shallowEqArray, formatKey, formatContentHeader,
} from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Claims' category if there are matching resources
//
export default class Claims extends React.Component {
  static catName = 'Claims';

  static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

  static compareFn(a, b) {
    return stringCompare(Claims.primaryText(a), Claims.primaryText(b));
  }

  // TODO
  static code(elt) {
    return null;
  }

  // TODO
  static primaryText(elt) {
    return Const.unknownValue;
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
    const match = FhirTransform.getPathItem(this.props.data, `[*category=${Claims.catName}]`);
    for (const elt of match) {
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

  render() {
    const firstRes = this.state.matchingData && this.state.matchingData[0];
    return (this.state.matchingData
      && (this.props.isEnabled || this.context.trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
      && (
      <div className="claims category-container" style={this.props.style} id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, Claims.catName, firstRes, this.context) }
        <div className="content-body">
          { this.props.isEnabled && renderClaims(this.state.matchingData, this.context) }
          { this.props.isEnabled && this.state.loadingRefs > 0 && <div className="category-loading">Loading ...</div> }
        </div>
      </div>
      ));
  }
}
