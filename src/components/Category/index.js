import React from 'react';
import PropTypes from 'prop-types';
import { useRecoilState } from 'recoil';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import '../../css/Selector.css';
import { activeCategoriesState } from '../../recoil';

//
// Render a DiscoveryApp category line
//
const Category = ({ categoryName }) => {
  const [activeCategories, setActiveCategories] = useRecoilState(activeCategoriesState);

  const isEnabled = activeCategories[categoryName];

  const handleChange = () => {
    setActiveCategories((prevActiveCategories) => ({
      ...prevActiveCategories,
      [categoryName]: !isEnabled,
    }));
  };

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
          label={categoryName}
          classes="label"
          className="provider-selector-nav"
        />
      </div>
    </div>
  );
};

Category.myName = 'Category';

Category.propTypes = {
  categoryName: PropTypes.string.isRequired,
};

export default Category;
