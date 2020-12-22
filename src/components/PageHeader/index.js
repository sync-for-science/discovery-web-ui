import React from 'react';
import PropTypes from 'prop-types';
import {
  NavLink, // , Router, Switch, Route,
} from 'react-router-dom';

import './PageHeader.css';

//
// Render the page header of DiscoveryApp page
//    if there is a 'logos' query parameter, its comma-separated
//    elements will be used as left-to-right logo css classes.
//
export default class PageHeader extends React.Component {
  static propTypes = {
    modalIsOpen: PropTypes.bool.isRequired,
    modalFn: PropTypes.func.isRequired, // Callback to handle clicks on header icons
  }

  state = {
    logoClasses: ['logo-s4s-button'], // Default value. Parsed from query string 'logos=a,b,c'
  }

  itemClick(itemName) {
    if (!this.props.modalIsOpen) {
      this.props.modalFn(itemName); // Let parent know to open the modal

      // Turn "on" the appropriate item
      switch (itemName) {
        case 'logoModal':
          for (const logoClass of this.state.logoClasses) {
            document.querySelector(`.${logoClass}-off`).className = `${logoClass}-on`;
          }
          break;
        default:
          break;
      }
    }
  }

  render() {
    return (
      <header>
        <div className="logo-box">
          { this.state.logoClasses.map(
            (logoClass, index) => <button className={`${logoClass}-off`} key={logoClass + index} onClick={() => this.itemClick('logoModal')} />,
          )}
        </div>
        <nav>
          <NavLink
            to={`/participant/${this.props.participantId}/summary`}
          >
            Summary
          </NavLink>
          <NavLink
            to={`/participant/${this.props.participantId}/catalog`}
          >
            Catalog
          </NavLink>
          <NavLink
            to={`/participant/${this.props.participantId}/compare`}
          >
            Compare
          </NavLink>
          <NavLink
            to={`/participant/${this.props.participantId}/timeline`}
          >
            Timeline
          </NavLink>
          <NavLink
            to={`/participant/${this.props.participantId}/collections`}
          >
            Collections
          </NavLink>
        </nav>
      </header>
    );
  }
}
