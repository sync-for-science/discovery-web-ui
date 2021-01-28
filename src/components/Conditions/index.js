import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, formatKey, formatContentHeader,
} from '../../util.js';

//
// Display the 'Conditions' category if there are matching resources
//
export default class Conditions extends React.Component {
  static catName = 'Conditions';

  static compareFn(a, b) {
    return stringCompare(Conditions.primaryText(a), Conditions.primaryText(b));
  }

  static code(elt) {
    return elt.data.code; // SNOMED
  }

  static primaryText(elt) {
    //      return elt.data.code.coding[0].display;
    //      return tryWithDefault(elt, elt => Conditions.code(elt).coding[0].display, Const.unknownValue);
    return primaryTextValue(Conditions.code(elt));
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
    const match = FhirTransform.getPathItem(this.props.data, `[*category=${Conditions.catName}]`);
    this.setState({
      matchingData: match.length > 0 ? match.sort(Conditions.compareFn)
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
      patient, providers, trimLevel, viewName,
    } = this.props;

    return (this.state.matchingData
      && (this.props.isEnabled || trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
      && (
      <div className="conditions category-container" id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, Conditions.catName, firstRes, { patient, trimLevel }) }
        <div className="content-body">
          { this.props.isEnabled && renderDisplay(this.state.matchingData, 'Condition', { providers, viewName }) }
        </div>
      </div>
      ));
  }
}
