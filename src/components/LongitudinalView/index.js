import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './LongitudinalView.css';
import FhirTransform from '../../FhirTransform.js';
import StandardFilters from '../StandardFilters';

import ContentPanel from '../ContentPanel';

//
// Render the "longitudinal" (timeline) view of the participant's data
//
export default class LongitudinalView extends Component {

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
      searchRefs: PropTypes.arrayOf(PropTypes.shape({	// Search results to highlight
	 provider: PropTypes.string.isRequired,
	 category: PropTypes.string.isRequired,
	 date: PropTypes.string.isRequired,
	 veryInteresting: PropTypes.bool.isRequired,
	 position: PropTypes.number.isRequired
      })),
      lastEvent: PropTypes.instanceOf(Event)
   }

   state = {
      catsEnabled: {},		    // Enabled status of categories
      provsEnabled: {},		    // Enabled status of providers
      minDate: this.props.dates.minDate,
      maxDate: this.props.dates.maxDate,
      contentPanelIsOpen: false
   }

// TODO: move to state init?
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
      this.setState({minDate: minDate, maxDate: maxDate});
   }

   onCloseContentPanel = () => {
      this.setState({ contentPanelIsOpen: false });
      // TODO: why is this here???
      this.props.contentPanelIsOpenFn(false);
   }

   render() {
      return (
	 <StandardFilters resources={this.props.resources} dates={this.props.dates} categories={this.props.categories} providers={this.props.providers}
			  searchRefs={this.props.searchRefs} enabledFn={this.setEnabled} dateRangeFn={this.setDateRange} lastEvent={this.props.lastEvent}
			  allowDotClick={true}>
	    <ContentPanel open={this.state.contentPanelIsOpen} onClose={() => this.setState({contentPanelIsOpen: false})}
			  catsEnabled={this.state.catsEnabled} provsEnabled={this.state.provsEnabled}
			  // context, nextPrevFn props added in StandardFilters
			  resources={this.props.resources} />
	 </StandardFilters>
      );
   }
}
