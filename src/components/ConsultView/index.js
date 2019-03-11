import React from 'react';
import PropTypes from 'prop-types';

import './ConsultView.css';
import FhirTransform from '../../FhirTransform.js';
import StandardFilters from '../StandardFilters';

//
// Render the Consult view of the participant's data
//
export default class ConsultView extends React.Component {

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
      categories: PropTypes.arrayOf(PropTypes.string),
      providers: PropTypes.arrayOf(PropTypes.string),
      lastEvent: PropTypes.instanceOf(Event)
   }

   state = {
      catsEnabled: {},		    // Enabled status of categories
      provsEnabled: {},		    // Enabled status of providers
      thumbLeftDate: this.props.dates.minDate,
      thumbRightDate: this.props.dates.maxDate
   }

   componentDidMount() {

   }

   setEnabled = this.setEnabled.bind(this);
   setEnabled(catsEnabled, provsEnabled) {
      this.setState({catsEnabled: catsEnabled,
		     provsEnabled: provsEnabled});
   }

   setDateRange = this.setDateRange.bind(this);
   setDateRange(minDate, maxDate) {
      this.setState({thumbLeftDate: minDate, thumbRightDate: maxDate});
   }

   render() {
      return (
	 <StandardFilters resources={this.props.resources} dates={this.props.dates} categories={this.props.categories} providers={this.props.providers}
			  enabledFn={this.setEnabled} dateRangeFn={this.setDateRange} lastEvent={this.props.lastEvent} allowDotClick={true}>
	    <div className='consult-view'>
	       <div className='consult-title'>
		  <div className='consult-title-name'>Consult</div>
	       </div>
	       <div className='consult-contents'>
		  Under development
	       </div>
	    </div>
	 </StandardFilters>
      );
   }
}
