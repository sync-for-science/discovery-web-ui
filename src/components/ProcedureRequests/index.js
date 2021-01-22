import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, shallowEqArray, formatKey, formatContentHeader, tryWithDefault,
} from '../../util.js';

//
// Display the 'Procedure Requests' category if there are matching resources
//
export default class ProcedureRequests extends React.Component {
  static catName = 'Procedure Requests';

  static compareFn(a, b) {
    return stringCompare(ProcedureRequests.primaryText(a), ProcedureRequests.primaryText(b));
  }

  static code(elt) {
    return tryWithDefault(elt, (elt) => elt.data.valueCodeableConcept, tryWithDefault(elt, (elt) => elt.data.code, null));
  }

  static primaryText(elt) {
    return primaryTextValue(ProcedureRequests.code(elt));
  }

  static propTypes = {
    data: PropTypes.array.isRequired,
    isEnabled: PropTypes.bool,
    showDate: PropTypes.bool,
  }

  state = {
    matchingData: null,
  }

  setMatchingData() {
    const match = FhirTransform.getPathItem(this.props.data, `[*category=${ProcedureRequests.catName}]`);
    this.setState({
      matchingData: match.length > 0 ? match.sort(ProcedureRequests.compareFn)
        : null,
    });
  }

  componentDidMount() {
    this.setMatchingData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!shallowEqArray(prevProps.data, this.props.data)) {
      this.setMatchingData();
    }
  }

  render() {
    const firstRes = this.state.matchingData && this.state.matchingData[0];
    const {
      patient, providers, trimLevel, viewName,
    } = this.props;
    return (this.state.matchingData
      && (this.props.isEnabled || trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
      && (
      <div className="procedure-requests category-container" id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, ProcedureRequests.catName, firstRes, { patient, trimLevel }) }
        <div className="content-body">
          { this.props.isEnabled && renderDisplay(this.state.matchingData, 'Procedure Request', { providers, viewName }) }
        </div>
      </div>
      ));
  }
}
