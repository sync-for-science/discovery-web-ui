import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './Allergies.css';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay } from '../../fhirUtil.js';
import { stringCompare } from '../../util.js';

//
// Display the 'Allergies' category if there are matching resources
//
export default class Allergies extends Component {

   static propTypes = {
      id: PropTypes.string,
      data: PropTypes.oneOfType([
	 PropTypes.object,
	 PropTypes.array,
	 PropTypes.string,
	 PropTypes.number
      ]).isRequired
   }

   state = {
      matchingData: null
   }

   componentDidMount() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Allergies]');
      if (match.length > 0) {
	 this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.code.coding[0].display, b.data.code.coding[0].display)) });
      }
   }

   render() {
      let data = this.state.matchingData;
      if (this.state.matchingData) {
	 return (
	    <div id={this.props.id} className={this.props.className}>
	       <div className={this.props.className+'-header'}>Allergies</div>
	       <div className={this.props.className+'-body'}>
		  { renderDisplay(data, this.props.className) }
	       </div>
		
		<div className='column-testing'>
			<div className='column-01'>col01</div>
			<div className='column-02'>col02</div>
			<div className='column-03'>col03</div>
			<div className='column-04'>col04</div>
			<div className='column-05'>col05</div>
			<div className='column-06'>col06</div>
			<div className='column-07'>col07</div>
			<div className='column-08'>col08</div>
			<div className='column-09'>col09</div>
			<div className='column-10'>col10</div>
			<div className='column-11'>col11</div>
			<div className='column-12'>col12</div>
			<div className='column-13'>col13</div>
			<div className='column-14'>col14</div>
			<div className='column-15'>col15</div>
			<div className='column-16'>col16</div>
			<div className='column-17'>col17</div>
			<div className='column-18'>col18</div>
			<div className='column-19'>col19</div>
			<div className='column-20'>col20</div>
			<div className='column-21'>col21</div>
			<div className='column-22'>col22</div>
			<div className='column-23'>col23</div>
			<div className='column-24'>col24</div>
			<div className='column-25'>col25</div>
			<div className='column-26'>col26</div>
			<div className='column-27'>col27</div>
			<div className='column-28'>col28</div>
			<div className='column-29'>col29</div>
			<div className='column-30'>col30</div>
			<div className='column-31'>col31</div>
			<div className='column-32'>col32</div>
			<div className='column-33'>col33</div>
			<div className='column-34'>col34</div>
			<div className='column-35'>col35</div>
			<div className='column-36'>col36</div>
			<div className='column-37'>col37</div>
			<div className='column-38'>col38</div>
			<div className='column-39'>col39</div>
			<div className='column-40'>col40</div>
		</div>
		
	    </div>
	 );
      } else {
	 return null;
      }
   }
}
