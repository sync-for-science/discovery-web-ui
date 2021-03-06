import React from 'react';
import { useRecoilValue } from 'recoil';
import { Typography } from '@material-ui/core';

import './CatalogView.css';
import SelectedCardCollection from '../SelectedCardCollection';
import RecordSelector from '../SelectedCardCollection/RecordSelector';
import NoResultsDisplay from '../NoResultsDisplay';
import ColumnBrowser from '../ColumnBrowser';
import {
  activeCategoriesState,
  activeProvidersState,
  filteredActiveCollectionState,
} from '../../recoil';

const CatalogView = () => {
  const filteredActiveCollection = useRecoilValue(filteredActiveCollectionState);
  const activeCategories = useRecoilValue(activeCategoriesState);
  const activeProviders = useRecoilValue(activeProvidersState);

  const { filteredRecordCount } = filteredActiveCollection;

  const columnsForCategories = Object.entries(filteredActiveCollection)
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
                  // uuids from filteredActiveCollection are a sortable Array:
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

  return (
    <div className="tiles-view">
      <div className="tiles-view-header">
        <Typography variant="s4sHeader">
          Record Selector
        </Typography>
      </div>
      <div className="tiles-view-container">
        <ColumnBrowser
          columns={columnsForCategories}
        >
          <NoResultsDisplay
            filteredRecordCount={filteredRecordCount}
            activeCategories={activeCategories}
            activeProviders={activeProviders}
          />
        </ColumnBrowser>
      </div>
      <SelectedCardCollection />
    </div>
  );
};

export default CatalogView;
