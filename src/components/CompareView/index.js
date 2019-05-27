import React from 'react';
import PropTypes from 'prop-types';

import './CompareView.css';
//import config from '../../config.js';
import { isValid, inDateRange } from '../../util.js';
import FhirTransform from '../../FhirTransform.js';
import Unimplemented from '../Unimplemented';
import Sparkline from '../Sparkline';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the "compare view" of the participant's data
//
export default class CompareView extends React.Component {

   static myName = 'CompareView';

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
      catsEnabled: PropTypes.object.isRequired,
      provsEnabled: PropTypes.object.isRequired,
      thumbLeftDate: PropTypes.string.isRequired,
      thumbRightDate: PropTypes.string.isRequired,
      lastEvent: PropTypes.instanceOf(Event)
   }

   getCoding(res) {
      switch (res.category) {
	 case 'Meds Dispensed':
	 case 'Meds Requested':
	    if (isValid(res, res => res.data.medicationCodeableConcept.coding[0])) {
	       return res.data.medicationCodeableConcept.coding[0];	// RxNorm
	    }
	    break;
	 case 'Immunizations':
	    if (isValid(res, res => res.data.vaccineCode.coding[0])) {
	       return res.data.vaccineCode.coding[0];			// CVX
	    }
	    break;
	 case 'Allergies':
	    if (isValid(res, res => res.data.code.coding[0])) {
	       return res.data.code.coding[0];				// SNOMED
	    } else if (isValid(res, res => res.data.substance.coding[0])) {
	       return res.data.substance.coding[0];			// NDFRT
	    }
	    break;
	 case 'Conditions':
	 case 'Procedures':
	    if (isValid(res, res => res.data.code.coding[0])) {
	       return res.data.code.coding[0];				// SNOMED
	    }
	    break;
	 case 'Lab Results':
	 case 'Social History':
	    if (isValid(res, res => res.data.code.coding[0])) {
	       return res.data.code.coding[0];				// LOINC
	    }
	    break;
         default:
	    return { code: '????', display: '????' };
      }
      return { code: '????', display: '????' };
   }

   // Categories we DON'T want to compare on
   get noCompareCategories() {
       return ['Patient', 'Vital Signs', 'Benefits', 'Claims', 'Encounters', Unimplemented.catName];
   }

   //
   // collectUnique()
   //
   // Resulting structure ('struct'):
   // {
   //	cat1: [
   //      {
   //         code: 'code1',
   //         display: 'disp1',
   //         provs: [
   //            {
   //               provName: 'prov1',
   //               count: count1,
   //		    minDate: 'date1',
   //		    maxDate: 'date2',
   //		    dates: [ {x: 'date', y: 0}, ... ]
   //            },
   //            ...
   //         ]
   //      },
   //      ...
   //   ],
   //   ...
   // }    
   //
   collectUnique(struct, cat, prov) {
      let resources = this.props.resources.pathItem(`[*category=${cat}][*provider=${prov}]`);
      for (let res of resources) {
	 if (this.noCompareCategories.includes(res.category) ||
	     !inDateRange(res.itemDate, this.props.thumbLeftDate, this.props.thumbRightDate)) {
	    break;
	 }

	 if (!struct.hasOwnProperty(cat)) {
	    // Add this category
	    struct[cat] = [];
//	    console.log('1 ' + cat + ' added');
	 }

	 let thisCat = struct[cat];
	 let coding = this.getCoding(res);
	 let thisCode = thisCat.find(elt => elt.code === coding.code);
	 let date = res.itemDate instanceof Date ? res.itemDate : new Date(res.itemDate);

	 if (thisCode) {
	    // Update previously added code
	    let provs = thisCode.provs;
	    let thisProv = provs.find(elt => elt.provName === prov);
	    if (thisProv) {
	       // Update previously added prov
	       thisProv.count++;
	       thisProv.minDate = date.getTime() < thisProv.minDate.getTime() ? date : thisProv.minDate;
	       thisProv.maxDate = date.getTime() > thisProv.maxDate.getTime() ? date : thisProv.maxDate;
	       thisProv.dates.push({x:date, y:0});
//	       console.log('2 ' + cat + ' ' + thisCode.code + ' ' + thisCode.display + ': ' + thisProv.provName + ' ' + thisProv.count);
	    } else {
	       // Add new prov
	       provs.push({ provName: prov, count: 1, minDate: date, maxDate: date, dates: [{x:date, y:0}] });
//	       console.log('3 ' + cat + ' ' + thisCode.code + ' ' + thisCode.display + ': ' + prov + ' 1');
	    }
	 } else {
	    // Add new code
	    thisCat.push({ code: coding.code, display: coding.display, provs: [{ provName: prov, count: 1, minDate: date, maxDate: date, dates: [{x:date, y:0}] }] });
//	    console.log('4 ' + cat + ' ' + coding.code + ' ' + coding.display + ': ' + prov + ' 1');
	 }
      }
   }
    
   formatCount(count) {
      return ' (' + count + (count === 1 ? ' time' : ' times') + ')';
   }

   renderContents() {
      let struct = {};
      for (let catName of this.props.categories) {
	 for (let provName of this.props.providers) {
	    if (this.props.provsEnabled[provName] !== false) {
	       this.collectUnique(struct, catName, provName);
	    }
	 }
      }
      
      let divs = [];
      let minDate = new Date(this.props.dates.minDate);
      let maxDate = new Date(this.props.dates.maxDate);
      for (let catName in struct) {
	 const isEnabled = !this.props.catsEnabled.hasOwnProperty(catName) || this.props.catsEnabled[catName];
	 divs.push(<div className={isEnabled ? 'compare-cat-name' : 'compare-cat-name-disabled'} key={divs.length}>{catName}</div>);
              
	 if (isEnabled) {
	    for (let thisCode of struct[catName]) {
	       divs.push(<div className='compare-code-display' key={divs.length}>{thisCode.display}</div>);
	       for (let thisProv of thisCode.provs) {
		  divs.push(<div className='compare-data-row' key={divs.length}>
			       <div className='compare-provider'>{thisProv.provName + this.formatCount(thisProv.count)}</div>
			       <Sparkline className='compare-sparkline' minDate={minDate} maxDate={maxDate} data={thisProv.dates} clickFn={this.onClick} />
			    </div>);
	       }
	    }
	 }
      }

      if (divs.length === 0) {
	 divs.push(<div className='compare-no-data' key='1'>[No matching data]</div>);
      }

      return divs;
   }

   catsToObj(cats) {
      let catObj = {};
      for (let cat of cats) {
	 catObj[cat] = true;
      }
      return catObj;
   }

   render() {
      return (
	 <div className='compare-view'>
	    <div className='compare-title'>
	       <div className='compare-title-name'>Compare</div>
	    </div>
	    <div className='compare-contents'>
	       { this.renderContents() }
	    </div>
	 </div>
      );
   }
}
