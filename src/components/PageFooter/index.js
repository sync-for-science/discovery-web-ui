import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './PageFooter.css';

import ContentPanel from '../ContentPanel';

var snapshotDate = null;

try {
   // Set snapshotDate if present
   snapshotDate = require('../../SNAPSHOT_DATE.js').snapshotDate;
} catch (err) {};

//
// Render the page footer of ParticipantDetail page
//
export default class PageFooter extends Component {

   static propTypes = {
      context: PropTypes.shape({
	 parent: PropTypes.string.isRequired,
	 rowName: PropTypes.string.isRequired,
	 dotType: PropTypes.string.isRequired,
	 minDate: PropTypes.string.isRequired,
	 maxDate: PropTypes.string.isRequired,
	 date: PropTypes.string.isRequired,
	 data: PropTypes.array
      }),
      nextPrevFn: PropTypes.func.isRequired,
      catsEnabled: PropTypes.object.isRequired,
      provsEnabled: PropTypes.object.isRequired
   }

   state = {
      contentPanelIsOpen: false,
      contentType: '',
      snapshotDate: null
   }
    
   componentDidMount() {
      this.setState({ snapshotDate: snapshotDate });
   }

   componentDidUpdate(prevProps, prevState) {
      if (!prevState.contentPanelIsOpen && prevProps.context !== this.props.context) {
	 this.setState({ contentPanelIsOpen: true });
      }
      if (prevProps.context !== this.props.context) {
	 this.setState({ contentType: this.props.context ? 'dotclick' : '' });
      }
   }

   onOpenContentPanel = (contentType) => {
      if (!this.state.contentPanelIsOpen) {
	 this.setState({ contentPanelIsOpen: true, contentType: contentType });
	 switch (contentType) {
//	    case 'pep':
//	       document.querySelector('.quick-look-data-panel-button-off').className = 'quick-look-data-panel-button-on';
//	       break;
//	    case 'search':
//	       document.querySelector('.search-button-off').className = 'search-button-on';
//	       break;
	    default:
	       break;
	 }
      }
   }

   onCloseContentPanel = (contentType) => {
      this.setState({ contentPanelIsOpen: false, contentType: '' });
      switch (contentType) {
//	 case 'pep':
//	    document.querySelector('.quick-look-data-panel-button-on').className = 'quick-look-data-panel-button-off';
//	    break;
//	 case 'search':
//	    document.querySelector('.search-button-on').className = 'search-button-off';
//	    break;
	 default:
	    break;
      }
   }

   render() {
      return (
	 <div className='page-footer'>
	    <ContentPanel open={this.state.contentPanelIsOpen} contentType={this.state.contentType}
			  onClose={this.onCloseContentPanel} context={this.props.context}
			  catsEnabled={this.props.catsEnabled} provsEnabled={this.props.provsEnabled} nextPrevFn={this.props.nextPrevFn} />
	    <div className='footer-snapshot-date'>
	       { this.state.snapshotDate ? `Snapshot: ${this.state.snapshotDate}` : null }
	    </div>
         </div>
      )
   }
}
