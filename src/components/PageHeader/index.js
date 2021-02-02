import React from 'react';
import { string } from 'prop-types';
import {
  NavLink, // , Router, Switch, Route,
} from 'react-router-dom';

import Modal from '../modals/Modal';
import {
  title as aboutTitle,
  Tooltip as AboutTooltip,
  Body as AboutBody,
} from '../modals/AboutDiscovery';
import UserProfile from '../UserProfile';
import './PageHeader.css';

const PageHeader = ({ patientMode, participantId }) => (
  <header>
    <UserProfile />
    <div className="logo-box">
      <Modal
        modalId="about-discovery"
        title={aboutTitle}
        tooltip={<AboutTooltip />}
        icon={(<span className="logo-s4s-button-off" />)}
      >
        <AboutBody />
      </Modal>
    </div>
    <nav>
      <NavLink
        to={`/${patientMode}/${participantId}/summary`}
      >
        Summary
      </NavLink>
      <NavLink
        to={`/${patientMode}/${participantId}/catalog`}
      >
        Catalog
      </NavLink>
      <NavLink
        to={`/${patientMode}/${participantId}/compare`}
      >
        Compare
      </NavLink>
      <NavLink
        to={`/${patientMode}/${participantId}/collections`}
      >
        Collections
      </NavLink>
    </nav>
  </header>
);

PageHeader.propTypes = {
  patientMode: string.isRequired,
  participantId: string.isRequired,
};

export default PageHeader;
