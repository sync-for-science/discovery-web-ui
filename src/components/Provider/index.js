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
    display: 'flex',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: '.8em',
  },
}));

const Provider = ({ providerName }) => {
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
          className={classes.checkbox}
          checked={isEnabled}
          onChange={handleChange}
          color="primary"
          style={{
            padding: 1,
          }}
        />
      )}
      label={titleCase(providerName)}
    />
  );
};

Provider.myName = 'Category';

Provider.propTypes = {
  providerName: PropTypes.string.isRequired,
};

export default Provider;
