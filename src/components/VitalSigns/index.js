import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './VitalSigns.css';

import FhirTransform from '../../FhirTransform.js';
import { renderSingleValue, renderPairValue } from '../../fhirUtil.js';

//
// Display the 'Vital Signs' category if there are matching resources
//
export default class VitalSigns extends Component {

   static propTypes = {
      id: PropTypes.string,
      data: PropTypes.oneOfType([
	 PropTypes.object,
	 PropTypes.array,
	 PropTypes.string,
	 PropTypes.number
      ]).isRequired
   }

   state = {
      matchingData: null
   }

   componentDidMount() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Vital Signs]');
      if (match.length > 0) {
	 this.setState({ matchingData: match });
      }
   }

   get renderOralTemperature() {
      return null;
   }

   // get renderBloodPressure() {
   //    let found = [];
   //    for (const elt of this.state.matchingData) {
   // 	 try {
   // 	    if (elt.data.code.coding[0].display==='Blood Pressure') {
   // 	       if (elt.data.component[0].code.coding[0].display==='Systolic Blood Pressure') {
   // 		   found.push({systolic:  elt.data.component[0].valueQuantity.value,
   // 			       diastolic: elt.data.component[1].valueQuantity.value,
   // 			       unit:      elt.data.component[0].valueQuantity.unit});
   // 	       } else {
   // 		   found.push({systolic:  elt.data.component[1].valueQuantity.value,
   // 			       diastolic: elt.data.component[0].valueQuantity.value,
   // 			       unit:      elt.data.component[0].valueQuantity.unit});
   // 	       }
   // 	    }
   // 	 } catch (e) {}
   //    }

   //    if (found.length > 0) {
   // 	  return found.map((elt, index) => 
   // 	     <div className={this.props.className+'-blood-pressure'} key={index}>
   // 	        <div className={this.props.className+'-blood-pressure-header'}>Blood Pressure</div>

   // 		<div className={this.props.className+'-blood-pressure-value'}>{elt.systolic}</div>
   // 		<div className={this.props.className+'-blood-pressure-unit'}>{elt.unit}</div>
   // 		<div className={this.props.className+'-blood-pressure-label'}>Systolic</div>

   // 		<div className={this.props.className+'-blood-pressure-value'}>{elt.diastolic}</div>
   // 		<div className={this.props.className+'-blood-pressure-unit'}>{elt.unit}</div>
   // 		<div className={this.props.className+'-blood-pressure-label'}>Diastolic</div>
   // 	     </div>
   // 	  );
   //    } else {
   // 	 return null;
   //    }
   // }

   render() {
      let data = this.state.matchingData;
      if (this.state.matchingData) {
	 return (
	    <div id={this.props.id} className={this.props.className}>
	       <div className={this.props.className+'-header'}>Vital Signs</div>
	       <div className={this.props.className+'-body'}>
		  { renderSingleValue(data, ['temperature'], 'Temperature') }
		  { this.renderOralTemperature }
		  { renderSingleValue(data, ['body height', 'height'], 'Body Height') }
		  { renderSingleValue(data, ['body weight', 'weight'], 'Body Weight') }
		  { renderSingleValue(data, ['respiratory rate', 'respiratory_rate'], 'Respiratory Rate') }
		  { renderSingleValue(data, ['heart rate', 'heart_rate'], 'Heart Rate') }
		  { renderPairValue(data,   ['blood pressure'], 'Systolic Blood Pressure', 'Systolic', 'Diastolic', 'Blood Pressure') }
		  { renderSingleValue(data, ['body mass index', 'bmi'], 'Body Mass Index (BMI)') }
	       </div>
	    </div>
	 );
      } else {
	 return null;
      }
   }
}
