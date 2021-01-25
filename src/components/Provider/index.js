import React from 'react';
import PropTypes from 'prop-types';
import { useRecoilState } from 'recoil';

import '../../css/Selector.css';
import { titleCase } from '../../util.js';
import { activeProvidersState } from '../../recoil';

//
// Render a DiscoveryApp category line
//
const Provider = ({ providerName }) => {
  const [activeProviders, setActiveProviders] = useRecoilState(activeProvidersState);

  const isEnabled = activeProviders[providerName];

  const handleButtonClick = () => {
    setActiveProviders((prevActiveCategories) => ({
      ...prevActiveCategories,
      [providerName]: !isEnabled,
    }));
  };

  return (
    <div className="selector">
      <div className="selector-nav">
        <button className={isEnabled ? 'selector-button-enabled' : 'selector-button-disabled'} onClick={handleButtonClick}>
          { titleCase(providerName) }
        </button>
      </div>
    </div>
  );
};

Provider.myName = 'Category';

Provider.propTypes = {
  providerName: PropTypes.string.isRequired,
};

export default Provider;
