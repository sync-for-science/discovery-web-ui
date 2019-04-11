import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import '../ContentPanel/ContentPanel.css';
import config from '../../config.js';

import FhirTransform from '../../FhirTransform.js';
import { renderDisplay } from '../../fhirUtil.js';
import { stringCompare, shallowEqArray, formatContentHeader } from '../../util.js';

import DiscoveryContext from '../DiscoveryContext';

//
// Display the 'Procedures' category if there are matching resources
//
export default class Procedures extends React.Component {

   static catName = 'Procedures';
			       
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
      let match = FhirTransform.getPathItem(this.props.data, '[*category=Procedures]');
      if (match.length > 0) {
	 this.setState({ matchingData: match.sort((a, b) => stringCompare(a.data.code.coding[0].display, b.data.code.coding[0].display)) });
	 for (var elt of match) {
	    this.resolveReasonReference(elt);
	 }
      } else {
	 this.setState({ matchingData: null });
      }
   }

   componentDidMount() {
      this.setMatchingData();
   }

   componentDidUpdate(prevProps, prevState) {
      if (!shallowEqArray(prevProps.data, this.props.data)) {
	 this.setMatchingData();
      }
   }

   componentWillUnmount() {
      // Cancel any pending async gets
      this.AxiosCancelSource.cancel('unmounting');
   }

   // TODO: Handle multiple reason references per single procedure
   //       Move to fhirUtil.js (with callback for state management)
   resolveReasonReference(elt) {
      if (elt.data.reasonReference && elt.data.reasonReference[0] && !elt.data.reasonReference[0].code) {
	 this.setState({loadingRefs: this.state.loadingRefs+1});
	 axios.get(config.serverUrl + '/reference/' + encodeURIComponent(elt.provider) + '/' + encodeURIComponent(elt.data.reasonReference[0].reference),
		   { cancelToken: this.AxiosCancelSource.token } )
	    .then(response => {
		// Add the de-referenced data to the reasonReference element
		elt.data.reasonReference[0] = Object.assign(elt.data.reasonReference[0], response.data);
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
      return ( this.state.matchingData &&
	       (this.props.isEnabled || this.context.trimLevel==='none') &&	// Don't show this category (at all) if disabled and trim set
	       <div className='procedures category-container'>
		  { formatContentHeader(this.props.isEnabled, 'Procedures', this.state.matchingData[0].itemDate, this.context) }
	          <div className='content-body'>
		     { this.props.isEnabled && renderDisplay(this.state.matchingData, 'Procedure', this.context) }
		     { this.props.isEnabled && this.state.loadingRefs > 0 && <div className='category-loading'>Loading ...</div> }
	          </div>
	       </div> );
   }
}
