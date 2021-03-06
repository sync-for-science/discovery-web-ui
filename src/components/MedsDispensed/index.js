import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderMeds, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, formatKey, formatContentHeader,
} from '../../util.js';

//
// Display the 'Meds Dispensed' category if there are matching resources
//
export default class MedsDispensed extends React.Component {
  static catName = 'Meds Dispensed';

  static compareFn(a, b) {
    return stringCompare(MedsDispensed.primaryText(a), MedsDispensed.primaryText(b));
  }

  static code(elt) {
    return elt.data.medicationCodeableConcept; // RxNorm
  }

  static primaryText(elt) {
    //      return elt.data.medicationCodeableConcept.coding[0].display;
    //      return tryWithDefault(elt, elt => MedsDispensed.code(elt).coding[0].display, Const.unknownValue);
    return primaryTextValue(MedsDispensed.code(elt));
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
    const match = FhirTransform.getPathItem(this.props.data, `[*category=${MedsDispensed.catName}]`);
    this.setState({
      matchingData: match.length > 0 ? match.sort(MedsDispensed.compareFn)
        : null,
    });
  }

  componentDidMount() {
    this.setMatchingData();
  }

  componentDidUpdate(prevProps, _prevState) {
    if (prevProps.data !== this.props.data) {
      this.setMatchingData();
    }
  }

  render() {
    const firstRes = this.state.matchingData && this.state.matchingData[0];
    const {
      patient, providers, trimLevel,
    } = this.props;
    return (this.state.matchingData
      && (this.props.isEnabled || trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
      && (
      <div className="meds-dispensed category-container" id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, MedsDispensed.catName, firstRes, { patient, trimLevel }) }
        <div className="content-body">
          { this.props.isEnabled && renderMeds(this.state.matchingData, providers) }
        </div>
      </div>
      ));
  }
}
