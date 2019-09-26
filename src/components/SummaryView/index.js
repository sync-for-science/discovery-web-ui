import React from 'react';
import PropTypes from 'prop-types';

import './SummaryView.css';
//import config from '../../config.js';
import FhirTransform from '../../FhirTransform.js';
import { formatPatientName, formatPatientAddress } from '../../fhirUtil.js';
import { formatDisplayDate, formatAge, titleCase } from '../../util.js';
import Unimplemented from '../Unimplemented';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the "Summary view" of the participant's data
//
export default class SummaryView extends React.Component {

   static myName = 'SummaryView';

   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

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
      lastEvent: PropTypes.instanceOf(Event)
   }

   //
   // Format participant info (property-value pairs) as list of divs
   //
   formatParticipantInfo(chunks) {
      let res = [];
      let key = 0;
      for (var prop in chunks) {
	 res.push(
	    <div className='demographics-label' key={key++}>
	       {prop}
	    </div> );
	 res.push(
	    <div className='demographics-info' key={key++}>
	       {this.formatValue(chunks[prop])}
	    </div> );	 
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
      let maxDate = null
      let key = 0;

      for (let provName of this.props.providers) {
	 let resArray = this.props.resources.transformed.filter(res => res.provider === provName && res.category !== 'Patient');
	 maxDate = resArray.reduce((high, res) => {
	    let date = res.itemDate instanceof Date ? res.itemDate : new Date(res.itemDate);
	    return date > high ? date : high;
	 }, null);

	 provs.push(
	    <div className='provider' key={key++}>
	       <div className='provider-name'>{provName}</div>
          <div className='provider-count'>{resArray.length}</div>
	       <div className='provider-newest'>{maxDate ? maxDate.getFullYear() : ''}</div>
	    </div>
	 );
      }

      return provs;
   }

   renderCategories() {
      let cats = [];
      let total = 0;
      let maxDate = null
      let resArray = null;
      let key = 0;

      for (let catName of this.props.categories) {
	 if (catName === Unimplemented.catName) {
	    resArray = this.props.resources.transformed.filter(res => Unimplemented.unimplementedCats.includes(res.category));
	    maxDate = null;

	 } else {
	    resArray = this.props.resources.transformed.filter(res => res.category === catName);
	    let firstDate = resArray[0].itemDate instanceof Date ? resArray[0].itemDate : new Date(resArray[0].itemDate);
	    maxDate = resArray.reduce((high, res) => {
	       let date = res.itemDate instanceof Date ? res.itemDate : new Date(res.itemDate);
	       return date > high ? date : high;
	    }, firstDate);
	 }

	 total += resArray.length;

	 cats.push(
	    <div className='record' key={key++}>
	        <div className='record-category'>{catName}</div> 
           <div className='record-count'>{resArray.length}</div>
	        <div className='record-newest'>{maxDate ? maxDate.getFullYear() : ''}</div>
	    </div>
	 );
      }

      return { cats, total }
   }

   renderLeftCol() {
      let name = formatPatientName(this.props.resources.pathItem('[category=Patient].data.name'));

      return (
	 <div className='summary-view-left-column'>
       <div className='participant'>
	      {name}         
       </div>
       <div className='data-range-container'>
            <div className='data-range-label'>
               DATA RANGE
            </div>
            <div className='data-range-value'>
               { formatDisplayDate(this.props.dates.minDate, true, true) } &ndash; { formatDisplayDate(this.props.dates.maxDate, true, true) }
            </div>
       </div>
	    <div className='view-info-container'>
	       <div className='view-info-graphic-catalog'/>
	       <div className='view-info-text'>
		  <b>Catalog</b> lists your unique clinical data by type.
	       </div>
	    </div>

	    <div className='view-info-container'>
	       <div className='view-info-graphic-compare'/>
	       <div className='view-info-text'>
		  <b>Compare</b> shows which providers have records of your unique clinical data.
	       </div>
	    </div>

	    <div className='view-info-container'>
	       <div className='view-info-graphic-timeline'/>
	       <div className='view-info-text'>
		  <b>Timeline</b> shows your detailed clinical and payer data over time.
	       </div>
	    </div>

	    <div className='view-info-container'>
	       <div className='view-info-graphic-payer'/>
	       <div className='view-info-text'>
		  <b>Payer</b> presents your claims and benefits data.
	       </div>
	    </div>
	 </div>
      );
   }

   render() {
      let birthDate = this.props.resources.pathItem('[category=Patient].data.birthDate');
      let dateOfDeath = this.props.resources.pathItem('[category=Patient].data.deceasedDateTime');
//      let name = formatPatientName(this.props.resources.pathItem('[category=Patient].data.name'));

      let chunks = { 'BIRTH DATE': formatDisplayDate(birthDate, true, true) };

      if (dateOfDeath) {
	 chunks['DATE OF DEATH'] = formatDisplayDate(dateOfDeath, true, false);
	 chunks['AGE AT DEATH'] = formatAge(birthDate, dateOfDeath, '');
      } else {
	 chunks['AGE'] = formatAge(birthDate, new Date(), '');
      }

      chunks.GENDER = titleCase(this.props.resources.pathItem('[category=Patient].data.gender'));
      chunks.ADDRESS = formatPatientAddress(this.props.resources.pathItem('[category=Patient].data.address'));

      let categories = this.renderCategories();

      return (
	 <div className='summary-view-container'>
	    { this.renderLeftCol() }
	    <div className='summary-view-right-column'>
	      {/*<div className='summary-view-right-column-header'>
	          <div className='summary-view-right-column-header-participant-name'>{ name }</div>
		  <div className='summary-view-right-column-header-data-range'>
		     <div className='summary-view-right-column-header-data-range-label'>DATA RANGE</div>
		     <div className='summary-view-right-column-header-data-range-value'>
			{ formatDisplayDate(this.props.dates.minDate, true, true) } &ndash; { formatDisplayDate(this.props.dates.maxDate, true, true) }
		     </div>
		  </div>
		  </div>*/}
	       <div className='summary-view-right-column-inner-container'>
		  <div className='demographics-column'>
		     <div className='demographics-column-header'>
			<div className='demographics-column-header-label'>
			   Demographics
			</div>
		     </div>
		     { this.formatParticipantInfo(chunks) }
		  </div>

		  <div className='records-column'>
		     <div className='records-column-header'>
			<div className='records-column-header-label'>Records</div>
			<div className='records-column-header-value'>{categories.total} Total</div>
		     </div>
		     <div className='records-column-label'>
			<div className='records-column-label-count'>COUNT</div>
			
			<div className='records-column-label-newest'>NEWEST</div>
		     </div>
		     <div className='records-column-inner'>
			{ categories.cats }
		     </div>
		  </div>

		  <div className='providers-column'>
		     <div className='providers-column-header'>
			<div className='providers-column-header-label'>Providers</div>
			<div className='providers-column-header-value'>{this.props.providers.length} Total</div>
		     </div>
		     <div className='providers-column-label'>
			<div className='providers-column-label-count'>RECORDS</div>
			
			<div className='providers-column-label-newest'>NEWEST</div>
		     </div>
		     <div className='providers-column-inner'>
			{ this.renderProviders() }
		     </div>
		  </div>
	       </div>
	    </div>
	 </div>
      );
   }
}
