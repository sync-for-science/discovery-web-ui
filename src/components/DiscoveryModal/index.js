import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-responsive-modal';

import './DiscoveryModal.css';

//
// Render Discovery modals
//
export default class DiscoveryModal extends Component {

   static propTypes = {
      isOpen: PropTypes.bool.isRequired,
      modalName: PropTypes.string.isRequired,
      onClose: PropTypes.func.isRequired,
      callbackFn: PropTypes.func.isRequired
   }

   //
   // Reformat 'val' converting each newline into <br/>
   // and return an array of elements.
   //
   formatValue(val) {
      let res = [];
      let key = 0;
      for (var elt of val.split('\n')) {
	 res.push(elt, <br key={key++} />);
      }
      return res;
   }

   //
   // Format 'obj' (property-value pairs) as div-based table
   //
   objToModalBody(obj, classNamePrefix) {
      let res = [];
      for (var prop in obj) {
	 res.push(
	       <div className={classNamePrefix+'-modal-body-row'}>
	       <div className={classNamePrefix+'-modal-body-property'}>
		  {prop}
	       </div>
		  <div className={classNamePrefix+'-modal-body-value'}>
		  {this.formatValue(obj[prop])}
	       </div>
	    </div>
	 );	 
      }
      return res;
   }

   modalClassNames = {
      overlay: 'discovery-modal-overlay',
      modal: 'discovery-modal',
      closeButton: 'discovery-modal-close-button',
      closeIcon: 'discovery-modal-close-icon'
   }

   renderLogoModal() {
      return (
	 <Modal open={this.props.isOpen} onClose={this.props.onClose} classNames={this.modalClassNames}>
	    <h4 className="logo-modal-title">About Sync for Science Discovery</h4>
	    <div className="logo-modal-body">
	       Copyright © 2018 Sync for Science<br/>
	       <div className="logo-modal-body-row">Version: beta 0.1.0</div>
	       <div className="logo-modal-body-row">Project Lead: David Kreda</div>
	       <div className="logo-modal-body-row">Project Development: Steve Klein</div>
	       <div className="logo-modal-body-row">UX and HTML/CSS: Bob Hires</div>
		  <div className="logo-modal-body-row"><div className="logo-modal-legal">Sync for Science and S4S are trademarks and/or service marks of the U.S. Department of Health and Human Services. 
		  Sync for Science is funded as part of the Patient-Centered Information Commons (NIH Project 5U54HG007963-03) at Harvard Medical School.</div></div> 
	    </div>
	 </Modal>
      )
   }

   renderPepModal() {
      return (
      	 <Modal open={this.props.isOpen} onClose={this.props.onClose} classNames={this.modalClassNames}>
      	    <h4 className="pep-modal-title">PEP</h4>
      	    <div className="pep-modal-body">

      	    </div>
      	 </Modal>
      )
   }

   renderSearchModal() {
      return (
	 <Modal open={this.props.isOpen} onClose={this.props.onClose} classNames={this.modalClassNames}>
	    <h4 className="search-modal-title">Search</h4>
	    <div className="search-modal-body">

	    </div>
	 </Modal>
      )
   }

   renderParticipantInfoModal() {
      return (
	 <Modal open={this.props.isOpen} onClose={this.props.onClose} classNames={this.modalClassNames}>
	    <h4 className="info-modal-title">Participant Info</h4>
	    <div className="info-modal-body">
	       { this.objToModalBody(this.props.callbackFn(this.props.modalName), 'info') }
	    </div>
	 </Modal>
      )
   }

   renderHelpModal() {
      return (
	 <Modal open={this.props.isOpen} onClose={this.props.onClose} classNames={this.modalClassNames}>
	    <h4 className="help-modal-title">Help</h4>
	    <div className="help-modal-body">

	    </div>
	 </Modal>
      )
   }

   renderDownloadModal() {
      return (
	 <Modal open={this.props.isOpen} onClose={this.props.onClose} classNames={this.modalClassNames}>
	    <h4 className="download-modal-title">Download</h4>
	    <div className="download-modal-body">

	    </div>
	 </Modal>
      )
   }

   renderPrintModal() {
      return (
	 <Modal open={this.props.isOpen} onClose={this.props.onClose} classNames={this.modalClassNames}>
	    <h4 className="print-modal-title">Print</h4>
	    <div className="print-modal-body">

	    </div>
	 </Modal>
      )
   }

   render() {
      switch (this.props.modalName) {
         case 'logoModal':
	    return this.renderLogoModal();
         case 'pepModal':
	    return this.renderPepModal();
         case 'searchModal':
	    return this.renderSearchModal();
         case 'participantInfoModal':
	    return this.renderParticipantInfoModal();
         case 'helpModal':
	    return this.renderHelpModal();
         case 'downloadModal':
	    return this.renderDownloadModal();
         case 'printModal':
	    return this.renderPrintModal();
         default:
	    return null;
      }
   }
}
