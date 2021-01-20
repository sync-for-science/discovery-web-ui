import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { primaryTextValue, renderMUIDisplay } from '../../fhirUtil.js';
import {
  Const, stringCompare,
} from '../../util.js';

import BaseCard from './BaseCard'
import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Conditions' category if there are matching resources
//
export const catName = 'Conditions';

const Conditions = ({data, isEnabled, showDate}) => {
  const [matchingData, setMatchingData] = useState(null)
  const contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'


  function compareFn(a, b) {
    return stringCompare(primaryText(a), primaryText(b));
  }

  function code(elt) {
    return elt.data.code; // SNOMED
  }

  function primaryText(elt) {
    //      return elt.data.code.coding[0].display;
    //      return tryWithDefault(elt, elt => Conditions.code(elt).coding[0].display, Const.unknownValue);
    return primaryTextValue(code(elt));
  }

  function parseMatchingData() {
    const match = FhirTransform.getPathItem(data, `[*category=${catName}]`);
    setMatchingData(match.length > 0 ? match.sort(compareFn) : null)
  }

  useEffect(() => {
    parseMatchingData()
  }, [])

  useEffect(() => {
    parseMatchingData()
  }, [data])
  
  const firstRes = matchingData && matchingData[0];
  const muiDisplay = matchingData && renderMUIDisplay(matchingData, 'Condition', contextType)[0]

  return (matchingData
    && (isEnabled || contextType.trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
    && (
      <BaseCard data={firstRes} showDate={showDate}>
        {muiDisplay}
      </BaseCard>
    ));
  }

Conditions.propTypes = {
  data: PropTypes.array.isRequired,
  isEnabled: PropTypes.bool,
  showDate: PropTypes.bool,
}

export default Conditions
