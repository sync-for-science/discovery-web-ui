import React from 'react';
import { useRecoilValue } from 'recoil';
import Categories from '../Categories';
import CategoryRollup from './CategoryRollup';
import Category from '../Category';
import { activeCategoriesState } from '../../recoil';

const CategoryFilter = () => {
  const [isExpanded, setExpanded] = React.useState(true);
  const activeCategories = useRecoilValue(activeCategoriesState);

  return (
    <Categories>
      <CategoryRollup
        isExpanded={isExpanded}
        expansionFn={() => setExpanded(!isExpanded)}
      />
      { isExpanded && Object.keys(activeCategories)
        .sort()
        .map((cat) => (
          <Category
            key={cat}
            categoryName={cat}
          />
        ))}
    </Categories>
  );
};

export default CategoryFilter;
