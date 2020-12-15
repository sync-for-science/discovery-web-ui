import React from 'react';
import PropTypes from 'prop-types';

import '../../css/Selector.css';
import './CategoryRollup.css';

import SVGContainer from '../SVGContainer';
import DotLine from '../DotLine';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the DiscoveryApp "rollup" category line
//
export default class CategoryRollup extends React.Component {
  static myName = 'CategoryRollup';

  static contextType = DiscoveryContext; // Allow the shared context to be accessed via 'this.context'

  static propTypes = {
    svgWidth: PropTypes.string.isRequired,
    dotPositionsFn: PropTypes.func.isRequired,
    dotClickFn: PropTypes.func,
    isExpanded: PropTypes.bool.isRequired,
    expansionFn: PropTypes.func.isRequired,
    catsEnabledFn: PropTypes.func.isRequired, // Callback to report changed category enable/disable
    noDots: PropTypes.bool,
    categories: PropTypes.arrayOf(PropTypes.string),
  }

  state = {
    isExpanded: this.props.isExpanded,
  }

  handleTwistyClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
    this.props.expansionFn('Categories', !this.state.isExpanded);
  }

  handleSetClearButtonClick = () => {
    const enabled = Object.keys(this.context.catsEnabled).reduce((count, key) => count + (this.context.catsEnabled[key]
    && this.props.categories.includes(key) ? 1 : 0), 0);
    let newCatsEnabled = {};

    if (enabled === 0) {
      // None enabled
      if (this.context.savedCatsEnabled) {
        // --> prior saved partial
        newCatsEnabled = this.context.savedCatsEnabled;
      } else {
        // --> all enabled
        for (const cat of this.props.categories) {
          newCatsEnabled[cat] = true;
        }
      }
    } else if (enabled < this.props.categories.length) {
      // Part enabled --> all enabled (and save partial)
      this.context.updateGlobalContext({ savedCatsEnabled: this.context.catsEnabled });
      for (const cat of this.props.categories) {
        newCatsEnabled[cat] = true;
      }
    } else {
      // All enabled --> none enabled
      for (const cat of this.props.categories) {
        newCatsEnabled[cat] = false;
      }
    }

    this.props.catsEnabledFn(newCatsEnabled);
  }

  buttonClass() {
    const enabled = this.context.catsEnabled ? Object.keys(this.context.catsEnabled).reduce((count, key) => count + (this.context.catsEnabled[key]
      && this.props.categories.includes(key) ? 1 : 0), 0)
      : 0;

    if (enabled === 0) return 'selector-rollup-nav-button-none';
    if (enabled < this.props.categories.length) return 'selector-rollup-nav-button-partial';
    return 'selector-rollup-nav-button-all';
  }

  render() {
    return (
      <div className="selector-rollup">
        <button className={this.state.isExpanded ? 'selector-rollup-nav-enabled' : 'selector-rollup-nav-disabled'} onClick={this.handleTwistyClick}>
          {/* Categories */}
          Records
        </button>
        <button className={this.buttonClass()} onClick={this.handleSetClearButtonClick} />
        <SVGContainer
          className="category-rollup-svg-container"
          style={this.props.noDots ? { backgroundImage: 'none' } : null}
          svgClassName="category-rollup-svg"
          svgWidth={this.props.svgWidth}
        >
          { !this.props.noDots
          && (
          <DotLine
            dotPositions={this.props.dotPositionsFn(CategoryRollup.myName, 'Categories', true)}
            context={{ parent: CategoryRollup.myName, rowName: 'Categories' }}
            dotClickFn={this.props.dotClickFn}
          />
          ) }
        </SVGContainer>
      </div>
    );
  }
}
