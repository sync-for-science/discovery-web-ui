import React from 'react';
import PropTypes from 'prop-types';
import { useRecoilValue } from 'recoil';

import './CatalogView.css';
import SelectedCardCollection from '../SelectedCardCollection';
import RecordSelector from '../SelectedCardCollection/RecordSelector';
import {
  activeCategoriesState,
  activeProvidersState,
  filteredActiveCollectionState,
} from '../../recoil';

class CompareView extends React.PureComponent {
  state = {
    firstTileColNum: 0,
    numVisibleCols: 0,
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
    if (this.noneEnabled(this.props.activeCategories)) {
      return 'No Record type is selected';
    } if (this.noneEnabled(this.props.activeProviders)) {
      return 'No Provider is selected';
    }
    return this.props.noResultDisplay ? this.props.noResultDisplay : 'No data found for the selected Records, Providers, and Time period';
  }

  renderTileColumns() {
    const { filteredActiveCollection } = this.props;
    const cols = Object.entries(filteredActiveCollection)
      .sort(([categoryLabel1], [categoryLabel2]) => ((categoryLabel1 < categoryLabel2) ? -1 : 1))
      .reduce((acc, [categoryLabel, category]) => {
        if (category?.filteredRecordCount) {
          acc.push(
            <div className="tiles-view-column-container" key={categoryLabel}>
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

  render() {
    return (
      <div className="tiles-view">
        <div className="tiles-view-header" />
        <div className="tiles-view-container">
          <div className="tiles-view-container-inner">
            { this.renderTileColumns() }
          </div>
        </div>
        <SelectedCardCollection />
      </div>
    );
  }
}

CompareView.propTypes = {
  filteredActiveCollection: PropTypes.shape({}),
  activeCategories: PropTypes.shape({}),
  activeProviders: PropTypes.shape({}),
};

const CompareViewHOC = (props) => {
  const filteredActiveCollection = useRecoilValue(filteredActiveCollectionState);
  const activeCategories = useRecoilValue(activeCategoriesState);
  const activeProviders = useRecoilValue(activeProvidersState);

  return (
    <CompareView
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      filteredActiveCollection={filteredActiveCollection}
      activeCategories={activeCategories}
      activeProviders={activeProviders}
    />
  );
};

export default CompareViewHOC;
