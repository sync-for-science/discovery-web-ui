import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './SummaryView.css';
import config from '../../config.js';
import FhirTransform from '../../FhirTransform.js';
import { formatPatientName, formatPatientAddress, formatPatientMRN } from '../../fhirUtil.js';
import { formatDate } from '../../util.js';

//
// Render the "Summary view" of the participant's data
//
export default class SummaryView extends Component {

   static propTypes = {
      resources: PropTypes.instanceOf(FhirTransform),
      dates: PropTypes.shape({
	    allDates: PropTypes.arrayOf(PropTypes.shape({
	    position: PropTypes.number.isRequired,
	    date: PropTypes.string.isRequired
	 })).isRequired,
	 minDate: PropTypes.string.isRequired,		// Earliest date we have data for this participant
	 startDate: PropTypes.string.isRequired,	// Jan 1 of minDate's year
	 maxDate: PropTypes.string.isRequired,		// Latest date we have data for this participant
	 endDate: PropTypes.string.isRequired		// Dec 31 of last year of timeline tick periods
      }),
      categories: PropTypes.arrayOf(PropTypes.string).isRequired,
      providers: PropTypes.arrayOf(PropTypes.string).isRequired,
      searchRefs: PropTypes.arrayOf(PropTypes.shape({	// Search results to highlight
	 provider: PropTypes.string.isRequired,
	 category: PropTypes.string.isRequired,
	 date: PropTypes.string.isRequired,
	 veryInteresting: PropTypes.bool.isRequired,
	 position: PropTypes.number.isRequired
      })),
      lastEvent: PropTypes.instanceOf(Event)
   }

   //
   // Format 'obj' (property-value pairs) as div-based table
   //
   objToModalBody(obj, classNamePrefix) {
      let res = [];
      let key = 0;
      for (var prop in obj) {
	 res.push(
	    <div className={classNamePrefix+'-body-row'} key={key++} >
	       <div className={classNamePrefix+'-body-property'}>
		  {prop}
	       </div>
		  <div className={classNamePrefix+'-body-value'}>
		  {this.formatValue(obj[prop])}
	       </div>
	    </div>
	 );	 
      }
      return res;
   }

   //
   // Reformat 'val' converting each newline into <br/>
   // and return an array of elements.
   //
   formatValue(val) {
      let res = [];
      let key = 0;
      for (var elt of val.split('\n')) {
	 res.push(elt, <br key={key++} />);
      }
      return res;
   }

   renderProviders() {
      let provs = [];
      let now = new Date();
      let key = 0;
      for (let provName of this.props.providers) {
	 let mrn = formatPatientMRN(this.props.resources.pathItem(`[*provider=${provName}][category=Patient].data.identifier`), config.summaryViewMaxMRNChars);
	 let resColl = this.props.resources.pathItem(`[*provider=${provName}]`);
	 let minDate = resColl.reduce((low, res) => {
	    let date = res.itemDate && (res.itemDate instanceof Date ? res.itemDate : new Date(res.itemDate));
	    return (date && date < low) ? date : low;
	 }, now);
	 let maxDate = resColl.reduce((high, res) => {
	    let date = res.itemDate && (res.itemDate instanceof Date ? res.itemDate : new Date(res.itemDate));
	    return (date && date > high) ? date : high;
	 }, null);

	 provs.push(
	    <div className='default-providers-name'     key={key++}>{provName}</div>,
	    <div className='default-providers-count'    key={key++}>{resColl.length}</div>,
	    <div className='default-providers-label1'   key={key++}>resources</div>,
	    <div className='default-providers-min-date' key={key++}>{formatDate(minDate.toISOString(), true, true)}</div>,
	    <div className='default-providers-label2'   key={key++}>to</div>,
	    <div className='default-providers-max-date' key={key++}>{formatDate(maxDate.toISOString(), true, true)}</div>,
	    <div className='default-providers-mrn'	key={key++}>{mrn}</div>
	 );
      }

      return (
	 <div className='default-providers-container'>
	    {provs}
	 </div>
      );
   }

   render() {
      let chunk = this.props.resources ? { Name: formatPatientName(this.props.resources.pathItem('[category=Patient].data.name')),
					   Address: formatPatientAddress(this.props.resources.pathItem('[category=Patient].data.address')),
					   Gender: this.props.resources.pathItem('[category=Patient].data.gender'),
					   'Birth Date': this.props.resources.pathItem('[category=Patient].data.birthDate'),
					 }
				       : null;

      return (
	 <div className='default-view'>
	    <div className='default-data-owner-title'>Data Owner</div>
	    { this.objToModalBody(chunk, 'default') }
	    <div className='default-providers-title'>Providers</div>
	    { this.renderProviders() }
	 </div>
      );
   }
}
