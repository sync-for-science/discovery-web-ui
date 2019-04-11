import React from 'react';
import PropTypes from 'prop-types';

import './CompareView.css';
import config from '../../config.js';
import { isValid, inDateRange } from '../../util.js';
import FhirTransform from '../../FhirTransform.js';
import StandardFilters from '../StandardFilters';
import Unimplemented from '../Unimplemented';

//
// Render the "compare view" of the participant's data
//
export default class CompareView extends React.Component {

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

   state = {
      catsEnabled: {},
      minDate: this.props.dates.minDate,
      maxDate: this.props.dates.maxDate
   }

   setEnabled = this.setEnabled.bind(this);
   setEnabled(catsEnabled, provsEnabled) {
      this.setState({catsEnabled: catsEnabled});
   }

   setDateRange = this.setDateRange.bind(this);
   setDateRange(minDate, maxDate) {
      this.setState({minDate: minDate, maxDate: maxDate});
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
       return ['Patient', 'Vital Signs', 'Benefits', 'Claims', Unimplemented.catName];
   }

   //
   // Resulting structure:
   // {
   //	cat1: [
   //      {
   //         code: 'code1',
   //         display: 'disp1',
   //         provs: [
   //            {
   //               provName: 'prov1',
   //               col: col1,
   //               count: count1
   //            },
   //            ...
   //         ]
   //      },
   //      ...
   //   ],
   //   ...
   // }    
   //
   collectUnique(struct, cat, prov, col) {
      let resources = this.props.resources.pathItem(`[*category=${cat}][*provider=${prov}]`);
      for (let res of resources) {
	 if (this.noCompareCategories.includes(res.category) ||
	     !inDateRange(res.itemDate, this.state.minDate, this.state.maxDate)) {
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
	 if (thisCode) {
	    // Update previously added code
	    let provs = thisCode.provs;
	    let thisProv = provs.find(elt => elt.provName === prov);
	    if (thisProv) {
	       // Update previously added prov
	       thisProv.count++;
//	       console.log('2 ' + cat + ' ' + thisCode.code + ' ' + thisCode.display + ': ' + thisProv.provName + ' ' + thisProv.count);
	    } else {
	       // Add new prov
	       provs.push({ provName: prov, col: col, count: 1 });
//	       console.log('3 ' + cat + ' ' + thisCode.code + ' ' + thisCode.display + ': ' + prov + ' 1');
	    }
	 } else {
	    // Add new code
	    thisCat.push({ code: coding.code, display: coding.display, provs: [{ provName: prov, col: col, count: 1 }] });
//	    console.log('4 ' + cat + ' ' + coding.code + ' ' + coding.display + ': ' + prov + ' 1');
	 }
      }
   }
    
   renderMatrix() {
      let struct = {};
      for (let catName of this.props.categories) {
	 let col = 2;
	 for (let provName of this.props.providers) {
	    this.collectUnique(struct, catName, provName, col++);
	 }
      }

      let divs = [];
      for (let catName in struct) {
	 const isEnabled = !this.state.catsEnabled.hasOwnProperty(catName) || this.state.catsEnabled[catName];
	 divs.push(<div className={isEnabled ? 'compare-cat-name' : 'compare-cat-name-disabled'} key={divs.length}>{catName}</div>);
	 if (isEnabled) {
	    for (let thisCode of struct[catName]) {
	       divs.push(<div className='compare-code-display' key={divs.length}>{thisCode.display}</div>);
//	       for (let thisProv of thisCode.provs) {
//		  divs.push(<div className={thisProv.col%2 === 0 ? 'compare-prov-count-even' : 'compare-prov-count-odd'}
//				 key={divs.length} style={{gridColumn: thisProv.col}}>{thisProv.count}</div>);
//	       }
	       let maxCount = thisCode.provs.reduce((acc, thisProv) => thisProv.count > acc ? thisProv.count : acc, 0);
	       for (let provNum = 0; provNum < this.props.providers.length; provNum++) {
		  let provName = this.props.providers[provNum];
		  let thisProv = thisCode.provs.find(elt => elt.provName === provName);
		  let thisHeight = thisProv ? config.compareViewMaxCountHeight * thisProv.count / maxCount : 0;
		  divs.push(<div className={provNum%2 === 0 ? 'compare-prov-count-even' : 'compare-prov-count-odd'}
				 key={divs.length} style={{gridColumn: provNum+2}}>
			       <div className={provNum%2 === 0 ? 'compare-prov-count-contents-even' : 'compare-prov-count-contents-odd'}
				    style={{height: thisHeight}}>
			    {/*  {thisProv ? thisProv.count : null} */}
			       </div>
			    </div>);
	       }
	    }
	 }
      }

      return divs;
   }

   renderProviders() {
      let divs = [];
      let col = 2;
      for (let provName of this.props.providers) {
	 divs.push(<div className='compare-prov-name' key={divs.length} style={{gridColumn: col++}}>{provName}</div>);
      }
      return divs;
   }

   render() {
      let dispCategories = this.props.categories.filter(cat => !this.noCompareCategories.includes(cat));
      return (
	 <StandardFilters resources={this.props.resources} dates={this.props.dates} categories={dispCategories} providers={this.props.providers}
			  enabledFn={this.setEnabled} dateRangeFn={this.setDateRange} lastEvent={this.props.lastEvent}>
	    <div className='compare-view'>
	       <div className='compare-title'>
		  <div className='compare-title-name'>Comparison</div>
	       </div>
	       <div className='compare-contents'>
		  <div className='compare-matrix'>
		     { this.renderMatrix() }
		  </div>
		  <div className='compare-providers'>
	             { this.renderProviders() }
		  </div>
	       </div>
	    </div>	
	 </StandardFilters>
      );
   }
}
