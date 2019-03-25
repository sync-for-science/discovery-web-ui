import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import '../ContentPanel/ContentPanel.css';

import config from '../../config.js';

import FhirTransform from '../../FhirTransform.js';
import { renderEOB } from '../../fhirUtil.js';
import { formatContentHeader, isValid } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Benefits' category if there are matching resources
//
export default class Benefits extends React.Component {

   static contextType = DiscoveryContext;	// Allow the shared context to be accessed via 'this.context'

   static propTypes = {
      data: PropTypes.array.isRequired,
      isEnabled: PropTypes.bool,
      showDate: PropTypes.bool
   }

   state = {
      matchingData: null,
      loadingRefs: 0
   }

   AxiosCancelSource = axios.CancelToken.source();

   setMatchingData() {
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Benefits]');
      for (let elt of match) {
	 this.resolveDiagnosisReference(elt);
      }
      this.setState({ matchingData: match.length > 0 ? match : null });
   }

   componentDidMount() {
      this.setMatchingData();
   }

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.data !== this.props.data) {
	 this.setMatchingData();
      }
   }

   componentWillUnmount() {
      // Cancel any pending async gets
      this.AxiosCancelSource.cancel('unmounting');
   }

   resolveDiagnosisReference(elt) {
      if (isValid(elt, e => e.data.diagnosis[0].diagnosisReference.reference) && !elt.data.diagnosis[0].diagnosisReference.code) {
	 this.setState({loadingRefs: this.state.loadingRefs+1});
	 axios.get(config.serverUrl + '/reference/' + encodeURIComponent(elt.provider) + '/' + encodeURIComponent(elt.data.diagnosis[0].diagnosisReference.reference),
		   { cancelToken: this.AxiosCancelSource.token } )
	    .then(response => {
		// Add the de-referenced data to the diagnosisReference element
		elt.data.diagnosis[0].diagnosisReference = Object.assign(elt.data.diagnosis[0].diagnosisReference, response.data);
		this.setState({loadingRefs: this.state.loadingRefs-1});
	    })
	    .catch(thrown => {
		if (!axios.isCancel(thrown)) {
		   console.log(thrown);
		   this.setState({loadingRefs: this.state.loadingRefs-1});
		}
	    });
      }
   }

   render() {
      return ( this.state.matchingData && this.state.matchingData.length > 0 &&
	       (this.props.isEnabled || this.context.trimLevel==='none') &&	// Don't show this category (at all) if disabled and trim set
	       <div className={this.props.className + ' category-container'}>
		  { formatContentHeader(this.props.isEnabled, 'Benefits', this.state.matchingData[0].itemDate, this.context) }
	          <div className='content-body'>
		     { this.props.isEnabled && renderEOB(this.state.matchingData, this.context) }
	             { this.props.isEnabled && this.state.loadingRefs > 0 && <div className='category-loading'>Loading ...</div> }
	          </div>
	       </div> );
   }
}
