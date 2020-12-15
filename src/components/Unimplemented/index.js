import React from 'react';
import PropTypes from 'prop-types';

import './Unimplemented.css';
import '../ContentPanel/ContentPanel.css';
import '../ContentPanel/ContentPanelCategories.css';

import FhirTransform from '../../FhirTransform.js';
import { renderUnimplemented } from '../../fhirUtil.js';
import { Const, stringCompare, stringifyEqArray, formatKey, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Unimplemented' categories if there are matching resources
//
export default class Unimplemented extends React.Component {

  static catName = 'Other';

  // Categories that currently aren't supported in views with the category selector
  // *** Should match "Currently unsupported" list in DiscoveryApp/index.js:categoriesForProviderTemplate() ***
  static unimplementedCats = ['Practitioner', 'List', 'Questionnaire', 'Questionnaire Response', 'Observation-Other',
    'Diagnostic Report', 'Care Plan', 'Medication', 'Organization', 'Goal', 'Basic',
    'Immunization Recommendation', 'Imaging Study', 'Coverage', 'Related Person', 'Device'];

  static contextType = DiscoveryContext;  // Allow the shared context to be accessed via 'this.context'

  static compareFn(a, b) {
    return stringCompare(Unimplemented.primaryText(a), Unimplemented.primaryText(b));
  }

  static code(elt) {
    return null;
  }

  static primaryText(elt) {
    return elt.category;
  }

  static propTypes = {
    data: PropTypes.array.isRequired,
    isEnabled: PropTypes.bool,
    showDate: PropTypes.bool
  }

  state = {
    matchingData: null
  }

  setMatchingData() {
    let queryString = '[* ' + Unimplemented.unimplementedCats.map(cat => 'category='+cat).join(' | ') + ']';
    let match = FhirTransform.getPathItem(this.props.data, queryString);
//      this.setState({ matchingData: match.length > 0 ? match.sort(Unimplemented.compareFn) : null });

    if (match.length === 0 && this.state.matchingData && this.state.matchingData.length !== 0) {
      // Clear prior matchingData
      this.setState({ matchingData: null });

    } else if (match.length > 0) {
      let sorted = match.sort(Unimplemented.compareFn);
      if (!stringifyEqArray(sorted, this.state.matchingData)) {
        // Set new matchingData
        this.setState({ matchingData: sorted });
      }
    }
  }

  componentDidMount() {
    this.setMatchingData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!stringifyEqArray(prevProps.data, this.props.data)) {
      this.setMatchingData();
    }
  }

  render() {
    let firstRes = this.state.matchingData && this.state.matchingData[0];
    return ( this.state.matchingData &&
      (this.props.isEnabled || this.context.trimLevel===Const.trimNone) &&  // Don't show this category (at all) if disabled and trim set
      <div className='unimplemented category-container' id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, Unimplemented.catName, firstRes, this.context) }
        <div className='content-body'>
          { this.props.isEnabled && renderUnimplemented(this.state.matchingData, this.context) }
        </div>
      </div> );
  }
}
