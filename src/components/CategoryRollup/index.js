import React from 'react';
import PropTypes from 'prop-types';

import '../../css/Selector.css';
import './CategoryRollup.css';

import { useRecoilState } from 'recoil';
import { activeCategoriesState, categoriesModeState } from '../../recoil';

//
// Render the DiscoveryApp "rollup" category line
//
class CategoryRollup extends React.PureComponent {
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    expansionFn: PropTypes.func.isRequired,
  }

  state = {
    isExpanded: this.props.isExpanded,
  }

  handleTwistyClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
    this.props.expansionFn('Categories', !this.state.isExpanded);
  }

  // getActiveCount = () => {
  //   const { activeCategories } = this.props;
  //   return Object.values(activeCategories).reduce((count, isActive) => count + (isActive ? 1 : 0), 0);
  // }

  handleSetClearButtonClick = () => {
    const {
      categoriesMode, setCategoriesMode,
    } = this.props;
    // const enabled = this.getActiveCount();

    // cycles from: active > all > none > active
    if (categoriesMode === 'none') { // (enabled === 0) {
      setCategoriesMode('active');
    } else if (categoriesMode === 'active') { // (enabled < categories.length) {
      setCategoriesMode('all');
    } else if (categoriesMode === 'all') {
      setCategoriesMode('none');
    }
  }

  buttonClass() {
    const { categoriesMode } = this.props;
    if (categoriesMode === 'none') {
      return 'selector-rollup-nav-button-none';
    } if (categoriesMode === 'active') {
      return 'selector-rollup-nav-button-partial';
    } if (categoriesMode === 'all') {
      return 'selector-rollup-nav-button-all';
    }
  }

  render() {
    return (
      <div className="selector-rollup">
        <button className={this.state.isExpanded ? 'selector-rollup-nav-enabled' : 'selector-rollup-nav-disabled'} onClick={this.handleTwistyClick}>
          Records
        </button>
        <button className={this.buttonClass()} onClick={this.handleSetClearButtonClick} />
      </div>
    );
  }
}

const CategoryRollupHOC = (props) => {
  const [activeCategories, setActiveCategories] = useRecoilState(activeCategoriesState);
  const [categoriesMode, setCategoriesMode] = useRecoilState(categoriesModeState);

  return (
    <CategoryRollup
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      activeCategories={activeCategories}
      setActiveCategories={setActiveCategories}
      categoriesMode={categoriesMode}
      setCategoriesMode={setCategoriesMode}
    />
  );
};

export default CategoryRollupHOC;
