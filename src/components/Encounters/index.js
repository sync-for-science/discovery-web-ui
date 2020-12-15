import React from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderEncounters, primaryTextValue } from '../../fhirUtil.js';
import { Const, stringCompare, formatKey, formatContentHeader, tryWithDefault } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Encounters' category if there are matching resources
//
export default class Encounters extends React.Component {

  static catName = 'Encounters';

  static contextType = DiscoveryContext;  // Allow the shared context to be accessed via 'this.context'

  static compareFn(a, b) {
    return stringCompare(Encounters.primaryText(a), Encounters.primaryText(b));
  }

  static code(elt) {
    // if (isValid(elt, elt => elt.data.type[0].coding[0].display) ||
    //     isValid(elt, elt => elt.data.type[0].text)) {
    //    return elt.data.type[0];
    // } else if (isValid(elt, elt => elt.data.type[0].coding[0]) &&
    //      isValid(elt, elt => elt.data.class)) {
    //    return { code: elt.data.type[0].coding[0].code, display: elt.data.class };
    // } else if (isValid(elt, elt => elt.data.class)) {
    //    return { code: elt.data.class, display: elt.data.class };
    // } else {
    //    return null;
    // }
    return tryWithDefault(elt, elt => elt.data.type[0], null);
  }

  static primaryText(elt) {
    // return tryWithDefault(elt, elt => elt.data.type[0].coding[0].display,
    //           tryWithDefault(elt, elt => elt.data.type[0].text, tryWithDefault(elt, elt => elt.data.class, '????')));
//      return tryWithDefault(elt, elt => Encounters.code(elt).coding[0].display,
//         tryWithDefault(elt, elt => Encounters.code(elt).text, Const.unknownValue));
    return primaryTextValue(Encounters.code(elt));
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
    let match = FhirTransform.getPathItem(this.props.data, `[*category=${Encounters.catName}]`);
    this.setState({ matchingData: match.length > 0 ? match.sort(Encounters.compareFn) : null });
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
    let firstRes = this.state.matchingData && this.state.matchingData[0];
    return ( this.state.matchingData &&
      (this.props.isEnabled || this.context.trimLevel===Const.trimNone) &&  // Don't show this category (at all) if disabled and trim set
      <div className='encounters category-container' id={formatKey(firstRes)}>
        { formatContentHeader(this.props.isEnabled, Encounters.catName, firstRes, this.context) }
        <div className='content-body'>
          { this.props.isEnabled && renderEncounters(this.state.matchingData, this.context) }
        </div>
      </div> );
  }
}
