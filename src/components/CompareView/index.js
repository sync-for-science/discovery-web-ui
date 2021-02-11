import React from 'react';
import { useRecoilValue } from 'recoil';

import './CompareView.css';
import SelectedCardCollection from '../SelectedCardCollection';
import RecordSelector from '../SelectedCardCollection/RecordSelector';
import Sparkline from '../Sparkline';

import {
  activeCategoriesState,
  activeProvidersState,
  timeFiltersState,
  filteredActiveCollectionState,
  resourcesState,
} from '../../recoil';

import { titleCase, inDateRange } from '../../util.js';

const formatYearRange = (minDate, maxDate, pre, post) => {
  const minYear = `${minDate.getFullYear()}`;
  const maxYear = `${maxDate.getFullYear()}`;

  return minYear === maxYear ? pre + minYear + post : `${pre + minYear} \u2013 ${maxYear}${post}`;
};

const noneEnabled = (obj) => Object.values(obj).reduce((acc, isEnabled) => (isEnabled ? false : acc), true);

const NoResultsDisplay = React.memo(({ filteredRecordCount, activeCategories, activeProviders }) => {
  if (filteredRecordCount) {
    return null;
  }

  let message = 'No data found for the selected Records, Providers, and Time period';
  if (noneEnabled(activeCategories)) {
    message = 'No Record type is selected';
  } else if (noneEnabled(activeProviders)) {
    message = 'No Provider is selected';
  }

  return (
    <div className="tiles-view-container-inner-empty" key="1">
      { message }
    </div>
  );
});

const ProvidersSparkLines = ({
  uuids, records, provs, minDate, maxDate,
}) => {
  const divs = [];

  for (const providerLabel of provs) {
    const data = uuids.reduce((acc, uuid) => {
      const r = records[uuid];
      if (r.provider === providerLabel) {
        if (inDateRange(r.itemDate, minDate, maxDate)) {
          acc.push({
            x: new Date(r.itemDate),
            y: 0,
          });
        }
      }
      return acc;
    }, []);
    if (data.length) {
      divs.push(
        <div className="compare-view-data-row" key={providerLabel}>
          <Sparkline
            className="compare-view-sparkline"
            minDate={minDate}
            maxDate={maxDate}
            data={data}
          />
          <div className="compare-view-provider">
            { titleCase(providerLabel) + formatYearRange(minDate, maxDate, ' [', ']') }
          </div>
        </div>,
      );
    }
  }

  return divs;
};

const CompareView = () => {
  const filteredActiveCollection = useRecoilValue(filteredActiveCollectionState);
  const activeCategories = useRecoilValue(activeCategoriesState);
  const activeProviders = useRecoilValue(activeProvidersState);

  const { filteredRecordCount } = filteredActiveCollection;
  const { records } = useRecoilValue(resourcesState);

  const {
    dateRangeStart, dateRangeEnd, dates, dates: { minDate, maxDate },
  } = useRecoilValue(timeFiltersState);
  // console.info('dateRangeStart, dateRangeEnd: ', dateRangeStart, dateRangeEnd);
  // console.info('minDate, maxDate: ', minDate, maxDate);

  const provs = Object.keys(activeProviders);

  const columnsForCategories = Object.entries(filteredActiveCollection)
    .sort(([categoryLabel1], [categoryLabel2]) => ((categoryLabel1 < categoryLabel2) ? -1 : 1))
    .reduce((acc, [categoryLabel, category]) => {
      if (category?.filteredRecordCount) {
        acc.push(
          <div className="compare-view-category-container" key={categoryLabel}>
            <div className="compare-view-title-container">
              <div className="compare-view-title">
                {categoryLabel}
                {/* <button className={this.buttonClass(categoryLabel)} onClick={() => this.handleSetClearButtonClick(categoryLabel)} /> */}
              </div>
            </div>
            { Object.entries(category.subtypes)
              .sort(([subtype1], [subtype2]) => ((subtype1 < subtype2) ? -1 : 1))
              .reduce((acc, [displayCoding, { uuids, _collectionUuids }]) => {
                if (uuids.length) {
                  acc.push(
                    <div
                      key={displayCoding}
                      className="compare-view-unique-item-container"
                    >
                      <RecordSelector
                        label={displayCoding}
                        uuids={uuids}
                      />
                      <div
                        className="compare-view-data-column"
                      >
                        <ProvidersSparkLines
                          uuids={uuids}
                          records={records}
                          provs={provs}
                          minDate={new Date(minDate)}
                          maxDate={new Date(maxDate)}
                        />
                      </div>
                    </div>,
                  );
                }
                return acc;
              }, []) }
          </div>,
        );
      }
      return acc;
    }, []);

  return (
    <div className="compare-view">
      <div className="compare-view-header" />
      <div className="compare-view-scroller">
        <div className="compare-view-all-unique-items">
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
