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

import './PageHeader.css';

const PageHeader = ({ participantId }) => (
  <header>
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
        to={`/participant/${participantId}/summary`}
      >
        Summary
      </NavLink>
      <NavLink
        to={`/participant/${participantId}/catalog`}
      >
        Catalog
      </NavLink>
      <NavLink
        to={`/participant/${participantId}/compare`}
      >
        Compare
      </NavLink>
      <NavLink
        to={`/participant/${participantId}/collections`}
      >
        Collections
      </NavLink>
    </nav>
  </header>
);

PageHeader.propTypes = {
  participantId: string.isRequired,
};

export default PageHeader;
