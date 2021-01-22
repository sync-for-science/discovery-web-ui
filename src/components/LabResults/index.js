import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderLabs, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, formatKey, formatContentHeader,
} from '../../util.js';

//
// Display the 'Lab Results' category if there are matching resources
//
export default class LabResults extends React.Component {
  static catName = 'Lab Results';

  static compareFn(a, b) {
    return stringCompare(LabResults.primaryText(a), LabResults.primaryText(b));
  }

  static code(elt) {
    return elt.data.code; // LOINC
  }

  static primaryText(elt) {
    //      return elt.data.code.coding[0].display;
    //      return tryWithDefault(elt, elt => LabResults.code(elt).coding[0].display, Const.unknownValue);
    return primaryTextValue(LabResults.code(elt));
  }

  static propTypes = {
    data: PropTypes.array.isRequired,
    isEnabled: PropTypes.bool,
    showDate: PropTypes.bool,
    resources: PropTypes.instanceOf(FhirTransform),
    dotClickFn: PropTypes.func,
  }

  state = {
    matchingData: null,
  }

  setMatchingData() {
    const match = FhirTransform.getPathItem(this.props.data, `[*category=${LabResults.catName}]`);
    this.setState({
      matchingData: match.length > 0 ? match.sort(LabResults.compareFn)
        : null,
    });
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
    const firstRes = this.state.matchingData && this.state.matchingData[0];
    const {
      patient, providers, trimLevel,
    } = this.props;
    return (this.state.matchingData
      && (this.props.isEnabled || trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
      && (
      <div className="lab-results category-container" id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, LabResults.catName, firstRes, { patient, trimLevel }) }
        <div className="content-body">
          { this.props.isEnabled && renderLabs(this.state.matchingData, this.props.resources, this.props.dotClickFn, providers) }
        </div>
      </div>
      ));
  }
}
