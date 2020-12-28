import React from 'react';

import '../DiscoveryModal/DiscoveryModal.css';

export const title = 'About Sync for Science Discovery';

export const Tooltip = () => 'About Sync for Science Discovery';

export const Body = () => (
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
);
