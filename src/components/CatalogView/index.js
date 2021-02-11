import React from 'react';
import { useRecoilValue } from 'recoil';

import './CatalogView.css';
import SelectedCardCollection from '../SelectedCardCollection';
import RecordSelector from '../SelectedCardCollection/RecordSelector';
import NoResultsDisplay from '../NoResultsDisplay';
import {
  activeCategoriesState,
  activeProvidersState,
  filteredActiveCollectionState,
} from '../../recoil';

const CompareView = () => {
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
      <div className="tiles-view-header" />
      <div className="tiles-view-container">
        <div className="tiles-view-container-inner">
          { columnsForCategories }
          <NoResultsDisplay
            filteredRecordCount={filteredRecordCount}
            activeCategories={activeCategories}
            activeProviders={activeProviders}
          />
        </div>
      </div>
      <SelectedCardCollection />
    </div>
  );
};

export default CompareView;
