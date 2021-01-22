import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderImmunizations, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, formatKey, formatContentHeader,
} from '../../util.js';
import { connectToResources } from '../../recoil';

//
// Display the 'Immunizations' category if there are matching resources
//
class Immunizations extends React.Component {
  static catName = 'Immunizations';

  static compareFn(a, b) {
    return stringCompare(Immunizations.primaryText(a), Immunizations.primaryText(b));
  }

  static code(elt) {
    return elt.data.vaccineCode; // CVX
  }

  static primaryText(elt) {
    //      return elt.data.vaccineCode.coding[0].display;
    //      return tryWithDefault(elt, elt => Immunizations.code(elt).coding[0].display, Const.unknownValue);
    return primaryTextValue(Immunizations.code(elt));
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
    const match = FhirTransform.getPathItem(this.props.data, `[*category=${Immunizations.catName}]`);
    this.setState({
      matchingData: match.length > 0 ? match.sort(Immunizations.compareFn)
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
      <div className="immunizations category-container" id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, Immunizations.catName, firstRes, { patient, trimLevel }) }
        <div className="content-body">
          { this.props.isEnabled && renderImmunizations(this.state.matchingData, providers) }
        </div>
      </div>
      ));
  }
}

export default connectToResources(Immunizations);
