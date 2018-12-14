import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './ReportView.css';
import { inDateRange } from '../../util.js';
import FhirTransform from '../../FhirTransform.js';
import StandardFilters from '../StandardFilters';

import Allergies from '../Allergies';
import Conditions from '../Conditions';
import DocumentReferences from '../DocumentReferences';
import Benefits from '../Benefits';
import Immunizations from '../Immunizations';
import LabResults from '../LabResults';
import MedsAdministration from '../MedsAdministration';
import MedsDispensed from '../MedsDispensed';
import MedsRequested from '../MedsRequested';
import MedsStatement from '../MedsStatement';
import Procedures from '../Procedures';
import SocialHistory from '../SocialHistory';
import VitalSigns from '../VitalSigns';

//
// Render the "report view" of the participant's data
//
export default class ReportView extends Component {

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

   state = {
      catsEnabled: {},
      provsEnabled: {},
      minDate: this.props.dates.minDate,
      maxDate: this.props.dates.maxDate
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

   catEnabled(cat) {
      return this.state.catsEnabled[cat] === undefined || this.state.catsEnabled[cat];
   }

   renderReport() {
      let dates = this.props.dates.allDates.filter(elt => inDateRange(elt.date, this.state.minDate, this.state.maxDate)).reverse();

      let divs = [];
      for (let thisDate of dates) {
	 let res = this.props.resources.pathItem(`[*itemDate=${thisDate.date}]`);
	 divs = divs.concat([
	    <Allergies           className='allergies'      key={divs.length+1}  data={res} showDate={true} isEnabled={this.catEnabled('Allergies')} />,
	    <Benefits		 className='benefits'       key={divs.length+4}  data={res} showDate={true} isEnabled={this.catEnabled('Benefits')} />,
	    <Conditions          className='conditions'     key={divs.length+2}  data={res} showDate={true} isEnabled={this.catEnabled('Conditions')} />,
	    <DocumentReferences  className='doc-refs'       key={divs.length+3}  data={res} showDate={true} isEnabled={this.catEnabled('Document References')} />,
	    <Immunizations       className='immunizations'  key={divs.length+5}  data={res} showDate={true} isEnabled={this.catEnabled('Immunizations')} />,
	    <LabResults          className='lab-results'    key={divs.length+6}  data={res} showDate={true} isEnabled={this.catEnabled('Lab Results')}
		 resources={this.props.resources} />,
	    <MedsAdministration  className='meds-admin'     key={divs.length+7}  data={res} showDate={true} isEnabled={this.catEnabled('Meds Administration')} />,
	    <MedsDispensed       className='meds-dispensed' key={divs.length+8}  data={res} showDate={true} isEnabled={this.catEnabled('Meds Dispensed')} />,
	    <MedsRequested       className='meds-requested' key={divs.length+9}  data={res} showDate={true} isEnabled={this.catEnabled('Meds Requested')} />,
	    <MedsStatement       className='meds-statement' key={divs.length+10} data={res} showDate={true} isEnabled={this.catEnabled('Meds Statement')} />,
	    <Procedures          className='procedures'     key={divs.length+11} data={res} showDate={true} isEnabled={this.catEnabled('Procedures')} />,
	    <SocialHistory       className='social-history' key={divs.length+12} data={res} showDate={true} isEnabled={this.catEnabled('Social History')} />,
	    <VitalSigns          className='vital-signs'    key={divs.length+13} data={res} showDate={true} isEnabled={this.catEnabled('Vital Signs')}
		 resources={this.props.resources} />
	 ]);
      }
      return divs;
   }

   render() {
      return (
	 <StandardFilters resources={this.props.resources} dates={this.props.dates} categories={this.props.categories} providers={this.props.providers}
			  searchRefs={this.props.searchRefs} enabledFn={this.setEnabled} dateRangeFn={this.setDateRange} lastEvent={this.props.lastEvent}>
	    <div className='report-contents'>
	       { this.renderReport() }
	    </div>
	 </StandardFilters>
      );
   }
}
