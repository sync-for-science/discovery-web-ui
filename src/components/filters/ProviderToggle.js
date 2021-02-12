import React from 'react';
import PropTypes from 'prop-types';
import { useRecoilState } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import { titleCase } from '../../util.js';
import { activeProvidersState } from '../../recoil';

const useStyles = makeStyles(() => ({
  root: {
    marginLeft: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: '.8em',
    marginLeft: 4,
  },
}));

const ProviderToggle = ({ providerName }) => {
  const classes = useStyles();

  const [activeProviders, setActiveProviders] = useRecoilState(
    activeProvidersState,
  );

  const isEnabled = activeProviders[providerName];

  const handleChange = () => {
    setActiveProviders((prevActiveCategories) => ({
      ...prevActiveCategories,
      [providerName]: !isEnabled,
    }));
  };

  return (
    <FormControlLabel
      classes={classes}
      control={(
        <Checkbox
          checked={isEnabled}
          onChange={handleChange}
          color="primary"
        />
      )}
      label={titleCase(providerName)}
    />
  );
};

ProviderToggle.propTypes = {
  providerName: PropTypes.string.isRequired,
};

export default ProviderToggle;
