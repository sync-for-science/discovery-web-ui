import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-responsive-modal';

import './DiscoveryModal.css';

//
// Render Discovery modals
//
export default class DiscoveryModal extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    modalName: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
  }

  modalClassNames = {
    overlay: 'discovery-modal-overlay',
    modal: 'discovery-modal',
    closeButton: 'discovery-modal-close-button',
    closeIcon: 'discovery-modal-close-icon',
  }

  renderLogoModal() {
    return (
      <Modal open={this.props.isOpen} onClose={() => this.props.onClose(this.props.modalName)} classNames={this.modalClassNames}>
        <h4 className="logo-modal-title">About Sync for Science Discovery</h4>
        <div className="logo-modal-body">
          <div className="logo-modal-photo-row">
            <div className="logo-modal-photo-one" />
            <div className="logo-modal-photo-two" />
            <div className="logo-modal-photo-three" />
          </div>
          <div className="logo-modal-body-row">
            <div className="logo-modal-body-property">Version:</div>
            <div className="logo-modal-body-value">Alpha 0.8 (User Test) </div>
          </div>
          <div className="logo-modal-body-row">
            <div className="logo-modal-body-property">Project Lead:</div>
            <div className="logo-modal-body-value">David Kreda</div>
          </div>
          <div className="logo-modal-body-row">
            <div className="logo-modal-body-property">Project Development</div>
            <div className="logo-modal-body-value">Steve Klein</div>
          </div>
          <div className="logo-modal-body-row">
            <div className="logo-modal-body-property">UX and HTML/CSS:</div>
            <div className="logo-modal-body-value">Bob Hires</div>
          </div>
          <div className="logo-modal-legal">
            <div className="logo-modal-body-row">
              Copyright © 2019 Sync for Science
            </div>
            <div className="logo-modal-body-row">
              Sync for Science and &nbsp;
              <a href="http://syncfor.science" target="_blank" rel="noopener noreferrer">S4S</a>
&nbsp; are trademarks and/or service marks of the U.S. Department of Health and Human Services.
            </div>
            <div className="logo-modal-body-row">
              Sync for Science is funded as part of the Patient-Centered Information Commons (NIH Project 5U54HG007963-03) at Harvard Medical School.
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  renderHelpModal() {
    return (
      <Modal open={this.props.isOpen} onClose={() => this.props.onClose(this.props.modalName)} classNames={this.modalClassNames}>
        <div className="help-modal-title">Discovery Guide</div>
        <div className="help-modal-body">
          <div className="help-modal-content">
            <div className="help-modal-header">Discovery Interface</div>
            <div />
            <ul>
              <li className="help-modal-list-item">Top of Page Controls</li>
              <li className="help-modal-list-item">Bottom of Page Controls</li>
              <li className="help-modal-list-item">Timeline Controls</li>
              <li className="help-modal-list-item">Categories</li>
              <li className="help-modal-list-item">Providers</li>
            </ul>
            <div className="help-modal-header" id="header">Top of Page Controls</div>
            <div />
            <ul>
              <li className="help-modal-list-item">Discovery Logo</li>
              <li className="help-modal-list-item">Font Size</li>
              <li className="help-modal-list-item">Participant Info</li>
              <li className="help-modal-list-item">Discovery Guide</li>
              <li className="help-modal-list-item">Download</li>
              <li className="help-modal-list-item">Print</li>
            </ul>
            <div className="help-modal-subheader">
              Discovery Logo
            </div>
            <div className="help-modal-subheader-content" />
            <div className="help-modal-subheader">
              Font Size Controls
            </div>
            <div className="help-modal-subheader-content" />
            <div className="help-modal-subheader">
              Participant Info
            </div>
            <div className="help-modal-subheader-content" />
            <div className="help-modal-subheader">
              Dicovery Guide
            </div>
            <div className="help-modal-subheader-content" />
            <div className="help-modal-subheader">
              Download
            </div>
            <div className="help-modal-subheader-content" />
            <div className="help-modal-subheader">
              Print
            </div>
            <div className="help-modal-subheader-content" />

            <div className="help-modal-header">Bottom of Page Controls</div>
            <div />
            <ul>
              <li className="help-modal-list-item">Quick View Button & Data Panel</li>
              <li className="help-modal-list-item">Search Button & Data Panel</li>
              <li className="help-modal-list-item">Calendar Button & Calendar Modal</li>
              <li className="help-modal-list-item">Date Range</li>
              <li className="help-modal-list-item">Time Range Selector</li>
            </ul>
            <div className="help-modal-subheader">
              Quick View Button & Data Panel
            </div>
            <div className="help-modal-subheader-content" />
            <div className="help-modal-subheader">
              Search Button & Data Panel
            </div>
            <div className="help-modal-subheader-content" />

            <div className="help-modal-header">Timeline Controls</div>
            <div />
            <ul>
              <li className="help-modal-list-item">Calendar Button & Calendar Modal</li>
              <li className="help-modal-list-item">Date Range</li>
              <li className="help-modal-list-item">Time Range Selector</li>
            </ul>
            <div className="help-modal-subheader">
              Calendar Button & Calendar Modal
            </div>
            <div className="help-modal-subheader-content" />
            <div className="help-modal-subheader">
              Date Range
            </div>
            <div className="help-modal-subheader-content" />
            <div className="help-modal-subheader">
              Time Range Selector
            </div>
            <div className="help-modal-subheader-content" />

            <div className="help-modal-header">Categories</div>
            <div />
            <ul>
              <li className="help-modal-list-item" />
              <li className="help-modal-list-item" />
            </ul>
            <div className="help-modal-subheader" />
            <div className="help-modal-subheader-content" />
            <div className="help-modal-subheader" />
            <div className="help-modal-subheader-content" />

            <div className="help-modal-header">Providers</div>
            <div />
            <ul>
              <li className="help-modal-list-item"> </li>
              <li className="help-modal-list-item" />
            </ul>

          </div>
        </div>
      </Modal>
    );
  }

  renderDownloadModal() {
    return (
      <Modal open={this.props.isOpen} onClose={() => this.props.onClose(this.props.modalName)} classNames={this.modalClassNames}>
        <div className="download-modal-title">
          Download –
          <em>Planned Feature</em>
        </div>
        <div className="download-modal-body">
          <div className="download-modal-body-row">
            <div className="download-modal-button">PDF</div>
          </div>
          <div className="download-modal-body-row">
            <div className="download-modal-button">FHIR Bundle</div>
          </div>
          <div className="download-modal-body-row">
            <div className="download-modal-button">CVS File</div>
          </div>
          <div className="download-modal-text-block">
            <p>
              <span className="download-modal-text-bold">Download</span>
              {' '}
              supports downloading data viewed in Discovery.
            </p>

            <p>We expect to support downloading in three formats:</p>
            <ul>
              <li>
                <span className="download-modal-text-bold">FHIR Bundles</span>
                {' '}
                in JSON
              </li>
              <li><span className="download-modal-text-bold">Comma delimited (CSV)</span></li>
              <li><span className="download-modal-text-bold">PDF</span></li>
            </ul>

            <p>We will explore options to:</p>
            <ul>
              <li>respect or ignore current category, provider, timeline filter settings</li>
              <li>download exactly what was received – without any augmentation (FHIR, CSV)</li>
              <li>download augmented data, e.g. having a provenance extension, etc. (FHIR, CSV)</li>
              <li>normalize FHIR downloads in DSTU2, STU3, or STU4 release format</li>
            </ul>
          </div>
        </div>
      </Modal>
    );
  }

  renderPrintModal() {
    return (
      <Modal open={this.props.isOpen} onClose={() => this.props.onClose(this.props.modalName)} classNames={this.modalClassNames}>
        <div className="print-modal-title">
          Print –
          <em>Planned Feature</em>
        </div>
        <div className="print-modal-body">
          <div className="print-modal-button">Print Panel Shown</div>
          <div className="print-modal-button">Print Selected Data</div>
          <div className="print-modal-button">Print All Data</div>
          <div className="print-modal-text-block">
            <p>
              <span className="print-modal-text-bold">Print</span>
              {' '}
              supports printing data viewed in Discovery.
            </p>
            <p>We expect to support printing in up to three formats:</p>
            <ul>
              <li>
                <span className="print-modal-text-bold">Plain Text</span>
                {' '}
                format with basic pagination
              </li>
              <li>
                <span className="print-modal-text-bold">Rich Text</span>
                {' '}
                format with basic pagination
              </li>
              <li>
                <span className="print-modal-text-bold">PDF Report</span>
                {' '}
                with “beyond basic” formatting
              </li>
            </ul>
            <p>We will explore having options to:</p>
            <ul>
              <li>respect or ignore current category, provider, timeline filter settings</li>
              <li>offer black/white and/or small/default/large font</li>
              <li>offer a PDF with contextual hypertext to NLM MedLinePlus</li>
              <li>offer a PDF form for reporting data problems</li>
            </ul>
          </div>
        </div>
      </Modal>
    );
  }

  render() {
    switch (this.props.modalName) {
      case 'logoModal':
        return this.renderLogoModal();
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
