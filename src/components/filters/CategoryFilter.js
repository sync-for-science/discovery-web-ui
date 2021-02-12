import React from 'react';
import { useRecoilValue } from 'recoil';
import CategoryRollup from './CategoryRollup';
import CategoryToggle from './CategoryToggle';
import { activeCategoriesState } from '../../recoil';
import '../../css/Selector.css';

const CategoryFilter = () => {
  const [isExpanded, setExpanded] = React.useState(true);
  const activeCategories = useRecoilValue(activeCategoriesState);

  return (
    <div className="selector-set">
      <CategoryRollup
        isExpanded={isExpanded}
        expansionFn={() => setExpanded(!isExpanded)}
      />
      { isExpanded && Object.keys(activeCategories)
        .sort()
        .map((cat) => (
          <CategoryToggle
            key={cat}
            categoryName={cat}
          />
        ))}
    </div>
  );
};

export default CategoryFilter;
