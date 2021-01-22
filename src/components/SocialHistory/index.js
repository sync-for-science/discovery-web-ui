import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderSocialHistory, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, formatKey, formatContentHeader,
} from '../../util.js';

//
// Display the 'Social History' category if there are matching resources
//
export default class SocialHistory extends React.Component {
  static catName = 'Social History';

  static compareFn(a, b) {
    return stringCompare(SocialHistory.primaryText(a), SocialHistory.primaryText(b));
  }

  static code(elt) {
    return elt.data.code; // LOINC
  }

  static primaryText(elt) {
    //      return elt.data.code.coding[0].display;
    //      return tryWithDefault(elt, elt => SocialHistory.code(elt).coding[0].display, Const.unknownValue);
    return primaryTextValue(SocialHistory.code(elt));
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
    const match = FhirTransform.getPathItem(this.props.data, `[*category=${SocialHistory.catName}]`);
    this.setState({
      matchingData: match.length > 0 ? match.sort(SocialHistory.compareFn)
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
      <div className="social-history category-container" id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, SocialHistory.catName, firstRes, { patient, trimLevel }) }
        <div className="content-body">
          { this.props.isEnabled && renderSocialHistory(this.state.matchingData, providers) }
        </div>
      </div>
      ));
  }
}
