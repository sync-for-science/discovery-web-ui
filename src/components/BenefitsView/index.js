import React from 'react';
import PropTypes from 'prop-types';

import './BenefitsView.css';
import FhirTransform from '../../FhirTransform.js';
import StandardFilters from '../StandardFilters';

import ContentPanel from '../ContentPanel';

//
// Render the Benefits view of the participant's data
//
export default class BenefitsView extends React.Component {

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
      thumbRightDate: this.props.dates.maxDate,
      contentPanelIsOpen: false
   }

   componentDidMount() {
      this.setState({ contentPanelIsOpen: true });
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

   onCloseContentPanel = () => {
      this.setState({ contentPanelIsOpen: false });
   }

   render() {
      return (
	 <StandardFilters resources={this.props.resources} dates={this.props.dates} categories={[ 'Claims', 'Benefits' ]} providers={this.props.providers}
			  catsEnabled={{ Claims:true, Benefits:true }} enabledFn={this.setEnabled} dateRangeFn={this.setDateRange}
			  lastEvent={this.props.lastEvent} allowDotClick={true}>
	    <ContentPanel open={this.state.contentPanelIsOpen} onClose={() => this.setState({contentPanelIsOpen: false})}
			  catsEnabled={this.state.catsEnabled} provsEnabled={this.state.provsEnabled}
			  // context, nextPrevFn, showAllFn props added in StandardFilters
			  thumbLeftDate={this.state.thumbLeftDate} thumbRightDate={this.state.thumbRightDate}
			  resources={this.props.resources} catsToDisplay={['Claims','Benefits']} viewName='Financial'
			  viewIconClass='benefits-view-icon' showAllData={true} />
	 </StandardFilters>
      );
   }
}
