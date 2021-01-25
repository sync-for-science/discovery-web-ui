import React from 'react';
import PropTypes from 'prop-types';
import { useRecoilState } from 'recoil';

import '../../css/Selector.css';
import { activeCategoriesState } from '../../recoil';

//
// Render a DiscoveryApp category line
//
const Category = ({ categoryName }) => {
  const [activeCategories, setActiveCategories] = useRecoilState(activeCategoriesState);

  const isEnabled = activeCategories[categoryName];

  const handleButtonClick = () => {
    setActiveCategories((prevActiveCategories) => ({
      ...prevActiveCategories,
      [categoryName]: !isEnabled,
    }));
  };

  return (
    <div className="selector">
      <div className="selector-nav">
        <button className={isEnabled ? 'selector-button-enabled' : 'selector-button-disabled'} onClick={handleButtonClick}>
          { categoryName }
        </button>
      </div>
    </div>
  );
};

Category.myName = 'Category';

Category.propTypes = {
  categoryName: PropTypes.string.isRequired,
};

export default Category;
