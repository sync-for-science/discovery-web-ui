import React from 'react';
import PropTypes from 'prop-types';
import { useRecoilState } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import { activeCategoriesState } from '../../recoil';

const useStyles = makeStyles(() => ({
  root: {
    marginLeft: 5,
  },
  label: {
    fontSize: ".8em",
  },
  checkbox: {
    padding: 1,
  },
}));

const Category = ({ categoryName }) => {
  const classes = useStyles();

  const [activeCategories, setActiveCategories] = useRecoilState(
    activeCategoriesState
  );

  const isEnabled = activeCategories[categoryName];

  const handleChange = () => {
    setActiveCategories((prevActiveCategories) => ({
      ...prevActiveCategories,
      [categoryName]: !isEnabled,
    }));
  };

  return (
    <FormControlLabel
      classes={classes}
      control={
        <Checkbox
          className={classes.checkbox}
          checked={isEnabled}
          onChange={handleChange}
          color="primary"
        />
      }
      label={categoryName}
    />
  );
};

Category.myName = "Category";

Category.propTypes = {
  categoryName: PropTypes.string.isRequired,
};

export default Category;
