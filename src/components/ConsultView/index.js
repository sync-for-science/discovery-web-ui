import React from 'react';
import PropTypes from 'prop-types';

import './ConsultView.css';
import FhirTransform from '../../FhirTransform.js';
import StandardFilters from '../StandardFilters';

import ContentPanel from '../ContentPanel';

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
      catsEnabled: {},				// Enabled status of categories
      provsEnabled: {},				// Enabled status of providers
      thumbLeftDate: this.props.dates.minDate,
      thumbRightDate: this.props.dates.maxDate,
      contentPanelIsOpen: false,
      dotClickDate: null			// dot click from ContentPanel
   }

   componentDidMount() {
      this.setState({ contentPanelIsOpen: true });
   }

   initialCats() {
      let cats = {};
      for (let cat of this.props.categories) {
	 cats[cat] = ['Conditions'].includes(cat);
      }
      return cats
   }

   setEnabled = this.setEnabled.bind(this);
   setEnabled(catsEnabled, provsEnabled) {
      this.setState({ catsEnabled: catsEnabled,
		      provsEnabled: provsEnabled });
   }

   setDateRange = this.setDateRange.bind(this);
   setDateRange(minDate, maxDate) {
      this.setState({ thumbLeftDate: minDate, thumbRightDate: maxDate });
   }

   onCloseContentPanel = () => {
      this.setState({ contentPanelIsOpen: false });
   }

   onDotClick = this.onDotClick.bind(this);
   onDotClick(dotClickDate) {
      this.setState({ dotClickDate: dotClickDate });
   }

   render() {
      return (
	 <StandardFilters resources={this.props.resources} dates={this.props.dates} categories={this.props.categories} providers={this.props.providers}
			  catsEnabled={this.initialCats()} enabledFn={this.setEnabled} dateRangeFn={this.setDateRange} lastEvent={this.props.lastEvent}
			  allowDotClick={true} dotClickDate={this.state.dotClickDate} >
	    <ContentPanel open={this.state.contentPanelIsOpen} onClose={() => this.setState({contentPanelIsOpen: false})}
			  catsEnabled={this.state.catsEnabled} provsEnabled={this.state.provsEnabled} dotClickFn={this.onDotClick}
			  // context, nextPrevFn props added in StandardFilters
			  thumbLeftDate={this.state.thumbLeftDate} thumbRightDate={this.state.thumbRightDate}
			  resources={this.props.resources} viewName='Consult' viewIconClass='consult-view-icon'
			  showAllData={true} initialTrimLevel='expected' />
	 </StandardFilters>
      );
   }
}
