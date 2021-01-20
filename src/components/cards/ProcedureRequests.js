import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, shallowEqArray, formatKey, formatContentHeader, tryWithDefault,
} from '../../util.js';

import BaseCard from './BaseCard'
import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Procedure Requests' category if there are matching resources
//
export default class ProcedureRequests extends React.Component {
  static catName = 'Procedure Requests';

  static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

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
    return (this.state.matchingData
      && (this.props.isEnabled || this.context.trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
      && (
        <BaseCard data={firstRes} showDate={this.props.showDate}>
          <div className="procedure-requests category-container" id={formatKey(firstRes)}>
            { formatContentHeader(this.props.isEnabled, ProcedureRequests.catName, firstRes, this.context) }
            <div className="content-body">
              { this.props.isEnabled && renderDisplay(this.state.matchingData, 'Procedure Request', this.context) }
            </div>
          </div>
        </BaseCard>
      ));
  }
}
