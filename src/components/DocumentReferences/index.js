import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, formatKey, formatContentHeader,
} from '../../util.js';

//
// Display the 'Document References' category if there are matching resources
//
export default class DocumentReferences extends React.Component {
  static catName = 'Document References';

  static compareFn(a, b) {
    return stringCompare(DocumentReferences.primaryText(a), DocumentReferences.primaryText(b));
  }

  static code(elt) {
    return elt.data.code ? elt.data.code : elt.data.type;
  }

  static primaryText(elt) {
    return primaryTextValue(DocumentReferences.code(elt));
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
    const match = FhirTransform.getPathItem(this.props.data, `[*category=${DocumentReferences.catName}]`);
    this.setState({
      matchingData: match.length > 0 ? match.sort(DocumentReferences.compareFn)
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
      <div className="document-references category-container" id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, DocumentReferences.catName, firstRes, { patient, trimLevel }) }
        <div className="content-body">
          { this.props.isEnabled && renderDisplay(this.state.matchingData, 'Document', { providers, viewName }) }
        </div>
      </div>
      ));
  }
}
