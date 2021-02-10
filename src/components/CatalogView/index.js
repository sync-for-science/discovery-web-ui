import React from 'react';
import PropTypes from 'prop-types';
import { useRecoilValue } from 'recoil';

import './CatalogView.css';
import SelectedCardCollection from '../SelectedCardCollection';
import RecordSelector from '../SelectedCardCollection/RecordSelector';
import {
  filteredActiveCollectionState,
} from '../../recoil';

class CompareView extends React.PureComponent {
  static propTypes = {
    filteredActiveCollection: PropTypes.shape({}),
    // resources: PropTypes.shape({
    //   patient: PropTypes.shape({}),
    //   providers: PropTypes.arrayOf(PropTypes.string),
    //   legacy: PropTypes.instanceOf(FhirTransform),
    // }),
    totalResCount: PropTypes.number,
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    providers: PropTypes.arrayOf(PropTypes.string).isRequired,
    catsEnabled: PropTypes.object.isRequired,
    provsEnabled: PropTypes.object.isRequired,
    thumbLeftDate: PropTypes.string.isRequired,
    thumbRightDate: PropTypes.string.isRequired,
    // context, nextPrevFn added in StandardFilters
  }

  state = {
    firstTileColNum: 0,
    // leftColNavEnabled: true,
    // rightColNavEnabled: true,
    uniqueStruct: {},
    numVisibleCols: 0,
    selectedTiles: {},
    // lastTileSelected: null,
    // topBound: 0,
    // onlyMultisource: false,
  }

  // onResize = () => {
  //   this.setState({ numVisibleCols: this.numVisibleCols() });
  // }

  handleSetClearButtonClick = (catName) => {
    console.error(`TODO: handleSetClearButtonClick(${catName}): re-impliment via recoil`); // eslint-disable-line no-console
  }

  hyphenate(name) {
    return name.toLowerCase().replace(/ /g, '-');
  }

  // buttonClass(catName) {
  //   const selectedTilesForCat = this.state.selectedTiles[this.hyphenate(catName)];
  //   const selectedCount = selectedTilesForCat ? Object.keys(selectedTilesForCat).length : 0;
  //   const tilesForCatCount = this.state.uniqueStruct[catName].length;
  //
  //   if (selectedCount === 0) return 'tiles-view-column-header-button-none';
  //   if (selectedCount < tilesForCatCount) return 'tiles-view-column-header-button-partial';
  //   return 'tiles-view-column-header-button-all';
  // }

  noneEnabled(obj) {
    for (const propName of Object.keys(obj)) {
      if (obj[propName]) {
        return false;
      }
    }
    return true;
  }

  get noResultDisplay() {
    if (this.noneEnabled(this.props.catsEnabled)) {
      return 'No Record type is selected';
    } if (this.noneEnabled(this.props.provsEnabled)) {
      return 'No Provider is selected';
    }
    console.error('this.props.noResultDisplay: ', this.props.noResultDisplay);
    return this.props.noResultDisplay ? this.props.noResultDisplay : 'No data found for the selected Records, Providers, and Time period';
  }

  renderTileColumns() {
    const { filteredActiveCollection } = this.props;
    const cols = Object.entries(filteredActiveCollection).reduce((acc, [categoryLabel, category]) => {
      if (category?.filteredRecordCount) {
        acc.push(
          <div className={`${this.hyphenate(categoryLabel)} tiles-view-column-container`} key={categoryLabel}>
            <div className="tiles-view-column-header">
              {categoryLabel}
              {/* <button className={this.buttonClass(categoryLabel)} onClick={() => this.handleSetClearButtonClick(categoryLabel)} /> */}
            </div>
            <div className="tiles-view-column-content">
              { Object.entries(category.subtypes)
                .sort(([subtype1], [subtype2]) => ((subtype1 < subtype2) ? -1 : 1))
                .reduce((acc, [displayCoding, { uuids, _collectionUuids }]) => {
                  if (uuids.length) {
                    acc.push(<RecordSelector
                      key={displayCoding}
                      label={displayCoding}
                      uuids={uuids}
                    />);
                  }
                  return acc;
                }, []) }
            </div>
          </div>,
        );
      }
      return acc;
    }, []);

    if (cols.length === 0) {
      cols.push(
        <div className="tiles-view-container-inner-empty" key="1">
          { this.noResultDisplay }
        </div>,
      );
    }

    return cols;
  }

  onNavClick = (dir) => {
    if (dir === 'left') {
      this.setState({ firstTileColNum: Math.max(0, this.state.firstTileColNum - 1) });
    } else {
      const maxFirstTileColNum = Object.keys(this.state.uniqueStruct).length - Math.trunc(this.state.numVisibleCols);
      this.setState({ firstTileColNum: Math.min(maxFirstTileColNum, this.state.firstTileColNum + 1) });
    }
  }

  onClearClick = () => {
    console.error('TODO: onClearClick: re-implement via recoil'); // eslint-disable-line no-console
  }

  render() {
    const { filteredActiveCollection, catsEnabled, provsEnabled } = this.props;

    // const enablededCategoryCount = Object.values(catsEnabled).reduce((acc, enabled) => (enabled ? (acc + 1) : acc), 0);
    const enablededCategoryCount = Object.values(filteredActiveCollection).reduce((acc, category) => (category.totalCount ? (acc + 1) : acc), 0);

    const maxFirstTileColNum = enablededCategoryCount - Math.trunc(this.state.numVisibleCols);

    const tileSelected = Object.keys(this.state.selectedTiles).length > 0;

    return (
      <div className="tiles-view">
        <div className="tiles-view-header" />
        <div className="tiles-view-container">
          { enablededCategoryCount > 0 && (
            <div className="tiles-view-nav-left">
              <button
                className={this.state.firstTileColNum > 0 ? 'tiles-view-nav-left-button-on' : 'tiles-view-nav-left-button-off'}
                onClick={() => this.onNavClick('left')}
              />
            </div>
          ) }
          <div className="tiles-view-container-inner">
            { this.renderTileColumns() }
          </div>
          { enablededCategoryCount > 0 && (
            <div className="tiles-view-nav-right">
              <button
                className={this.state.firstTileColNum < maxFirstTileColNum ? 'tiles-view-nav-right-button-on' : 'tiles-view-nav-right-button-off'}
                onClick={() => this.onNavClick('right')}
              />
            </div>
          ) }
        </div>
        <SelectedCardCollection />
      </div>
    );
  }
}

const CompareViewHOC = (props) => {
  const filteredActiveCollection = useRecoilValue(filteredActiveCollectionState);

  return (
    <CompareView
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      filteredActiveCollection={filteredActiveCollection}
    />
  );
};

export default CompareViewHOC;
