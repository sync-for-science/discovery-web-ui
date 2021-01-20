import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';

import '../ContentPanel/ContentPanel.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay, primaryTextValue } from '../../fhirUtil.js';
import {
  Const, stringCompare, formatKey, formatContentHeader,
} from '../../util.js';

import BaseCard from './BaseCard'
import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Conditions' category if there are matching resources
//
export const catName = 'Conditions';

const Conditions = ({data, isEnabled, showDate}) => {
  const [matchingData, setMatchingData] = useState(null)
  console.log('matchingData: ', matchingData)
  const contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'


  function compareFn(a, b) {
    console.log('a', a)
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



  // state = {
  //   matchingData: null,
  // }

  function parseMatchingData() {
    const match = FhirTransform.getPathItem(data, `[*category=${catName}]`);
    console.log('match', match)
    setMatchingData(match.length > 0 ? match.sort(compareFn) : null)
  }

  useEffect(() => {
    parseMatchingData()
  }, [])

  useEffect(() => {
    parseMatchingData()
  }, [data])

  // componentDidMount() {
  //   this.setMatchingData();
  // }

  // componentDidUpdate(prevProps, prevState) {
  //   if (prevProps.data !== this.props.data) {
  //     this.setMatchingData();
  //   }
  // }

  
  const firstRes = matchingData && matchingData[0];
  console.log('firstRes', firstRes)
  console.log('contextType', contextType)

  return (matchingData
    && (isEnabled || contextType.trimLevel === Const.trimNone) // Don't show this category (at all) if disabled and trim set
    && (
      <BaseCard data={firstRes} showDate={showDate}>
        <div className="conditions category-container" id={formatKey(firstRes)}>
          {/* { formatContentHeader(isEnabled, Conditions.catName, firstRes, contextType) } */}
          <div className="content-body">
            { isEnabled && renderDisplay(matchingData, 'Condition', contextType) }
          </div>
        </div>

        <Grid container>
          <Grid item>Container</Grid>
          <Grid item>Value</Grid>
        </Grid>
      </BaseCard>
    ));
  }

Conditions.propTypes = {
  data: PropTypes.array.isRequired,
  isEnabled: PropTypes.bool,
  showDate: PropTypes.bool,
}

export default Conditions
