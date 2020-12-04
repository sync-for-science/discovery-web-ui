import React from 'react';
import PropTypes from 'prop-types';

import './DiabetesView.css';
import FhirTransform from '../../FhirTransform.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the Diabetes view of the participant's data
//
export default class DiabetesView extends React.Component {

   static myName = 'DiabetesView';

   static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      resources: PropTypes.instanceOf(FhirTransform),
      dates: PropTypes.shape({
 allDates: PropTypes.arrayOf(PropTypes.shape({
    position: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired
 })).isRequired,
 minDate: PropTypes.string.isRequired,  // Earliest date we have data for this participant
 startDate: PropTypes.string.isRequired, // Jan 1 of minDate's year
 maxDate: PropTypes.string.isRequired,  // Latest date we have data for this participant
 endDate: PropTypes.string.isRequired  // Dec 31 of last year of timeline tick periods
      }),
      categories: PropTypes.arrayOf(PropTypes.string).isRequired,
      providers: PropTypes.arrayOf(PropTypes.string).isRequired,
      catsEnabled: PropTypes.object.isRequired,
      provsEnabled: PropTypes.object.isRequired,
      thumbLeftDate: PropTypes.string.isRequired,
      thumbRightDate: PropTypes.string.isRequired,
      lastEvent: PropTypes.instanceOf(Event)
   }

   render() {
      return (
 <div className='diabetes-view'>
    <div className='diabetes-title'>
       <div className='diabetes-title-name'>Diabetes</div>
    </div>
    <div className='diabetes-contents'>
               <div className='diabetes-placeholder'></div>
            </div>
 </div>
      );
   }
}
