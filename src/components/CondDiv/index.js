import React from 'react';
import PropTypes from 'prop-types';

import { Const } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Conditional Div
//
// Returns children unless:
//    1. 'check' is defined AND all of its elements are 'undefined'
//    2. this.context.trimLevel === 'max'
//    3. this.context.trimLevel === 'expected' AND 'check' is defined AND 'expected' is defined AND
//       at least one of the elements of expected === an element of 'check'
//
export default class CondDiv extends React.Component {

   static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      check:PropTypes.oneOfType([
 PropTypes.any,
 PropTypes.arrayOf(PropTypes.any)
      ]),
      expected:PropTypes.oneOfType([
 PropTypes.any,
 PropTypes.arrayOf(PropTypes.any)
      ])
   }

   //
   // Determine whether a display element/value should be 'trimmed' (not displayed) based on trimLevel
   //
   trim(checkVal, expected) {
      let checkValArray = Array.isArray(checkVal) ? checkVal : [ checkVal ];
      let expectedArray = Array.isArray(expected) ? expected : [ expected ];

      switch (this.context.trimLevel) {
 // Unconditionally trim this element/value
         case Const.trimMax:
    return true;

 // Only trim 'expected' (typical) values
         case Const.trimExpected:
    return checkValArray.some( checkVal => expectedArray.includes(checkVal) );

 // Unconditionally show this element/value
         default:
         case Const.trimNone:
    return false;
      }
   }

   render() {
      let allUndefined = this.props.hasOwnProperty('check') &&
 Array.isArray(this.props.check) ? this.props.check.every(elt => elt === undefined) : this.props.check === undefined;
      return allUndefined || this.trim(this.props.check, this.props.expected) ? null : this.props.children;
   }
}
