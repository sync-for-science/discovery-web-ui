import React from 'react';
import PropTypes from 'prop-types';
import { useRecoilState } from 'recoil';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import '../../css/Selector.css';
import { titleCase } from '../../util.js';
import { activeProvidersState } from '../../recoil';

//
// Render a DiscoveryApp provider line
//
const Provider = ({ providerName }) => {
  const [activeProviders, setActiveProviders] = useRecoilState(activeProvidersState);

  const isEnabled = activeProviders[providerName];

  const handleChange = () => {
    setActiveProviders((prevActiveCategories) => ({
      ...prevActiveCategories,
      [providerName]: !isEnabled,
    }));
  };

  // return (
  //   <div className="selector">
  //     <div className="selector-nav">
  //       <button className={isEnabled ? 'selector-button-enabled' : 'selector-button-disabled'} onClick={handleButtonClick}>
  //         { titleCase(providerName) }
  //       </button>
  //     </div>
  //   </div>
  // );

  return (
    <div>
      <div>
        <FormControlLabel
          control={
            <Checkbox
              checked={isEnabled}
              onChange={handleChange}
              color="primary"
            />
          }
          label={titleCase(providerName)}
          classes="label"
          className="provider-selector-nav"
        />
      </div>
    </div>
  );
};

Provider.myName = 'Category';

Provider.propTypes = {
  providerName: PropTypes.string.isRequired,
};

export default Provider;
