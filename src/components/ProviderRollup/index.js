import React from 'react';
import PropTypes from 'prop-types';

// import './ProviderRollup.css';
import '../../css/Selector.css';

import { useRecoilState } from 'recoil';
import { activeProvidersState, providersModeState } from '../../recoil';

//
// Render the DiscoveryApp "rollup" provider line
//
class ProviderRollup extends React.Component {
  static myName = 'ProviderRollup';

  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    expansionFn: PropTypes.func.isRequired,
  }

  state = {
    isExpanded: this.props.isExpanded,
  }

  handleTwistyClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
    this.props.expansionFn('Providers', !this.state.isExpanded);
  }

  // getActiveCount = () => {
  //   const { activeProviders } = this.props;
  //   return Object.values(activeProviders).reduce((count, isActive) => count + (isActive ? 1 : 0), 0);
  // }

  handleSetClearButtonClick = () => {
    const {
      providersMode, setProvidersMode,
    } = this.props;
    // const enabled = this.getActiveCount();

    // cycles from: active > all > none > active
    if (providersMode === 'none') { // (enabled === 0) {
      setProvidersMode('active');
    } else if (providersMode === 'active') { // (enabled < providers.length) {
      setProvidersMode('all');
    } else if (providersMode === 'all') {
      setProvidersMode('none');
    }
  }

  buttonClass() {
    const { providersMode } = this.props;
    if (providersMode === 'none') {
      return 'selector-rollup-nav-button-none';
    } if (providersMode === 'active') {
      return 'selector-rollup-nav-button-partial';
    } if (providersMode === 'all') {
      return 'selector-rollup-nav-button-all';
    }
  }

  render() {
    return (
      <div className="selector-rollup">
        <button className={this.state.isExpanded ? 'selector-rollup-nav-enabled' : 'selector-rollup-nav-disabled'} onClick={this.handleTwistyClick}>
          Providers
        </button>
        <button className={this.buttonClass()} onClick={this.handleSetClearButtonClick} />
      </div>
    );
  }
}

const ProviderRollupHOC = (props) => {
  const [activeProviders, setActiveProviders] = useRecoilState(activeProvidersState);
  const [providersMode, setProvidersMode] = useRecoilState(providersModeState);

  return (
    <ProviderRollup
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      activeProviders={activeProviders}
      setActiveProviders={setActiveProviders}
      providersMode={providersMode}
      setProvidersMode={setProvidersMode}
    />
  );
};

export default ProviderRollupHOC;
