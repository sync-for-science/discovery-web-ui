import React from 'react';
import Categories from '../Categories';
import CategoryRollup from '../CategoryRollup';
import Category from '../Category';

const CategoryFilter = () => (
  <Categories>
    <CategoryRollup
      isExpanded={this.state.catsExpanded}
      expansionFn={this.onExpandContract}
    />
    { this.state.catsExpanded ? [
      this.props.categories && this.props.categories.map(
        (cat) => (
          <Category
            key={cat}
            categoryName={cat}
          />
        ),
      ),
      <div className="standard-filters-category-nav-spacer-bottom" key="1" />,
    ] : null }
  </Categories>
);

export default CategoryFilter;
