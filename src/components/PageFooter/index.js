import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './PageFooter.css';

import ContentPanel from '../ContentPanel';

//
// Render the page footer of ParticipantDetail page
//
export default class PageFooter extends Component {

   static propTypes = {
      callbackFn: PropTypes.func.isRequired,	// Callback to fetch data for ContentPanel
      context: PropTypes.shape({
	 parent: PropTypes.string.isRequired,
	 rowName: PropTypes.string.isRequired,
	 dotType: PropTypes.string.isRequired,
	 location: PropTypes.string.number
      })
   }

   state = {
      contentPanelIsOpen: false,
      contentType: ''
   }
    
   componentDidUpdate(prevProps, prevState) {
      if (!prevState.contentPanelIsOpen && prevProps.context !== this.props.context) {
	 this.setState({ contentPanelIsOpen: true });
      }
      if (prevProps.context !== this.props.context) {
	 this.setState({ contentType: this.props.context ? 'dotclick' : '' });
      }
   }

   onOpenContentPanel = (contentType) => this.setState({ contentPanelIsOpen: true, contentType: contentType });
   onCloseContentPanel = () => this.setState({ contentPanelIsOpen: false, contentType: '' });

   render() {
      return (
	 <div className='page-footer'>
	    <div className='footer-controls-box'>
	       <button className="pep-data-panel-button-off" onClick={() => this.onOpenContentPanel('pep')} />
	       <button className="search-button-off"	     onClick={() => this.onOpenContentPanel('search')} />
	    </div>
	      <ContentPanel open={this.state.contentPanelIsOpen} contentType={this.state.contentType}
	  		    onClose={this.onCloseContentPanel} callbackFn={this.props.callbackFn} />
         </div>
      )
   }
}
