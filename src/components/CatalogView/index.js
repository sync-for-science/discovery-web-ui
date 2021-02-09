import React from 'react';
import PropTypes from 'prop-types';
import { useRecoilValue } from 'recoil';

import './CatalogView.css';
import FhirTransform from '../../FhirTransform.js';
import SelectedCardCollection from '../SelectedCardCollection';
import RecordSelector from '../SelectedCardCollection/RecordSelector';
import {
  groupedRecordIdsBySubtypeState,
} from '../../recoil';

class CompareView extends React.PureComponent {
  static propTypes = {
    groupedRecordIdsBySubtype: PropTypes.shape({}),
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

  buttonClass(catName) {
    const selectedTilesForCat = this.state.selectedTiles[this.hyphenate(catName)];
    const selectedCount = selectedTilesForCat ? Object.keys(selectedTilesForCat).length : 0;
    const tilesForCatCount = this.state.uniqueStruct[catName].length;

    if (selectedCount === 0) return 'tiles-view-column-header-button-none';
    if (selectedCount < tilesForCatCount) return 'tiles-view-column-header-button-partial';
    return 'tiles-view-column-header-button-all';
  }

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
    return this.props.noResultDisplay ? this.props.noResultDisplay : 'No data found for the selected Records, Providers, and Time period';
  }

  renderTiles(catName) {
    const { groupedRecordIdsBySubtype } = this.props;
    const tiles = [];
    if (groupedRecordIdsBySubtype[catName]) {
      Object.entries(groupedRecordIdsBySubtype[catName].subtypes)
        .sort(([subtype1], [subtype2]) => ((subtype1 < subtype2) ? -1 : 1))
        .forEach(([displayCoding, uuids]) => {
          tiles.push(<RecordSelector
            key={displayCoding}
            label={displayCoding}
            uuids={uuids}
          />);
        });
    }
    return tiles;
  }

  renderTileColumns() {
    const cols = [];
    for (const catName of Object.keys(this.state.uniqueStruct).slice(this.state.firstTileColNum,
      this.state.firstTileColNum + Math.ceil(this.state.numVisibleCols))) {
      cols.push(
        <div className={`${this.hyphenate(catName)} tiles-view-column-container`} key={catName}>
          <div className="tiles-view-column-header">
            {catName}
            <button className={this.buttonClass(catName)} onClick={() => this.handleSetClearButtonClick(catName)} />
          </div>
          <div className="tiles-view-column-content">
            { this.renderTiles(catName) }
          </div>
        </div>,
      );
    }

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
    const maxFirstTileColNum = Object.keys(this.state.uniqueStruct).length - Math.trunc(this.state.numVisibleCols);
    const tileSelected = Object.keys(this.state.selectedTiles).length > 0;
    return (
      <div className="tiles-view">
        <div className="tiles-view-header">
          <div
            className={tileSelected ? 'tiles-view-header-button-clear-selected' : 'tiles-view-header-button-clear'}
            onClick={this.onClearClick}
          >
            Clear
          </div>
        </div>
        <div className="tiles-view-container">
          { Object.keys(this.state.uniqueStruct).length > 0 && (
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
          { Object.keys(this.state.uniqueStruct).length > 0 && (
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
  const groupedRecordIdsBySubtype = useRecoilValue(groupedRecordIdsBySubtypeState);

  return (
    <CompareView
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      groupedRecordIdsBySubtype={groupedRecordIdsBySubtype}
    />
  );
};

export default CompareViewHOC;
