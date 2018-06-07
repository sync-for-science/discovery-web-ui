import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './PageHeader.css';

//
// Render the page header of ParticipantDetail page
//
export default class PageHeader extends Component {

   static propTypes = {
      modalFn: PropTypes.func.isRequired	// Callback to handle clicks on header icons
   }

   render() {
      return (
	 <div className='page-header'>
	    <div className="logo-box">
	       <button className="logo-button-off"           onClick={() => this.props.modalFn('logoModal')} />
	      {/*	       <button className="pep-data-panel-button-off" onClick={() => this.props.modalFn('pepModal')} /> */}
	    </div>
	    <div className="header-controls-box">
	      {/*	      <button className="search-button-off"		      onClick={() => this.props.modalFn('searchModal')} /> */}

	      <button className="text-size-smaller-button-off" />
	      <button className="text-size-larger-button-off" />
	      <button className="patient-information-male-button-off" onClick={() => this.props.modalFn('participantInfoModal')} />
	      <button className="help-button-off"		      onClick={() => this.props.modalFn('helpModal')} />
	      <button className="download-button-off"		      onClick={() => this.props.modalFn('downloadModal')} />
	      <button className="print-button-off"		      onClick={() => this.props.modalFn('printModal')} />
	    </div>
	 </div>
      )
   }
}
