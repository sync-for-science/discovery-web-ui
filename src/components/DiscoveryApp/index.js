import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, Redirect } from 'react-router-dom';
import { useRecoilValue, useRecoilState } from 'recoil';
import { get } from 'axios';

import './DiscoveryApp.css';
import config from '../../config.js';
import { log } from '../../utils/logger';
import PageHeader from '../PageHeader';
import StandardFilters from '../StandardFilters';
import ContentPanel from '../ContentPanel/ContentRight';
import SummaryView from '../SummaryView';
import CompareView from '../CompareView';
import CatalogView from '../CatalogView';
import Collections from '../Collections';
import PageFooter from '../PageFooter';
import { PATIENT_MODE_SEGMENT } from '../../index';
import {
  normalizeResourcesAndInjectPartipantId, generateRecordsDictionary, generateLegacyResources, computeFilterState, extractProviders, extractCategories,
} from '../../utils/api';
import {
  resourcesState, timeFiltersState, activeCategoriesState, activeProvidersState,
} from '../../recoil';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the top-level Discovery application page
//
class DiscoveryApp extends React.PureComponent {
  static propTypes = {
    match: PropTypes.object,
  }

  state = {
    // resources: null, // Will be set to an instance of FhirTransform
    // totalResCount: null, // Number of resources excluding Patient resources
    // dates: null, // Collection of dates for views:
    //    allDates
    //    minDate     Earliest date we have data for this participant
    //    startDate     Jan 1 of minDate's year
    //    maxDate     Latest date we have data for this participant
    //    endDate     Dec 31 of maxDate's year
    searchRefs: [], // Search results to highlight
    // isLoading: false,
    // fetchError: null, // Possible axios error object
    // lastEvent: null,
    // thumbLeftDate: null,
    // thumbRightDate: null,
    dotClickDate: null, // dot click from ContentPanel

    // catsEnabled: null,
    // provsEnabled: null,
    // providers: [],

    // Shared Global Context
    updateGlobalContext: (updates) => this.setState(updates),

    savedCatsEnabled: null, // StandardFilters & CategoryRollup
    savedProvsEnabled: null, // StandardFilters & ProviderRollup

    lastTileSelected: null, // CatalogView & CompareView
    savedSelectedTiles: null, // CatalogView & CompareView
    lastSavedSelectedTiles: null, // CatalogView & CompareView
    viewAccentDates: [], // CatalogView & CompareView
    viewLastAccentDates: [], // CatalogView & CompareView
    highlightedResources: [], // CatalogView & CompareView
    lastHighlightedResources: [], // CatalogView & CompareView
    onlyMultisource: false, // CatalogView & CompareView

    onlyAnnotated: false, // ContentPanel
  }

  onDotClick = (dotClickDate) => {
    this.setState({ dotClickDate });
  }

  calcContentPanelTopBound() {
    try {
      const headerBot = document.querySelector('.time-widget').getBoundingClientRect().top;
      const targetTop = document.querySelector('.standard-filters-categories-and-providers').getBoundingClientRect().top;
      log(`Top Bound: ${targetTop - headerBot}`);
      return targetTop - headerBot;
    } catch (e) {
      return 0;
    }
  }

  calcContentPanelBottomBound() {
    try {
      const footTop = document.querySelector('.page-footer').getBoundingClientRect().top;
      const headerBot = document.querySelector('.time-widget').getBoundingClientRect().bottom;
      log(`Bottom Bound: ${footTop - headerBot + 26}`);
      return footTop - headerBot + 26;
    } catch (e) {
      return 0;
    }
  }

  render() {
    const { error, loading, legacy: legacyResources } = this.props.resources;

    if (error) {
      return <p>{ `DiscoveryApp: ${error.message}` }</p>;
    }

    if (loading) {
      return <p>Loading ...</p>;
    }

    const { match: { params: { activeView = 'summary', patientMode, participantId } } } = this.props;

    const isSummary = activeView === 'summary';
    const hasCardListRight = ['catalog', 'compare'].includes(activeView);

    const {
      resources, activeCategories, activeProviders, timeFilters,
    } = this.props;

    const { dates, thumbLeftDate, thumbRightDate } = timeFilters;

    const {
      totalResCount, providers, categories,
    } = resources;

    return (
      <DiscoveryContext.Provider value={{ ...this.state, ...this.props.timeFilters }}>
        <div className="discovery-app">
          <PageHeader
            patientMode={patientMode}
            participantId={participantId}
          />
          <div id="outer-container" className={`route-${activeView}`}>
            <div id="left-filters" style={{ display: isSummary ? 'none' : 'block' }} />
            <div id="inner-container">
              <div className="standard-filters" style={{ display: isSummary ? 'none' : 'block' }}>
                <StandardFilters
                  activeView={activeView} // trigger timeline resizing when route changes
                  resources={legacyResources}
                  dates={dates}
                  categories={categories}
                  catsEnabled={activeCategories}
                  providers={providers}
                  provsEnabled={activeProviders}
                  // lastEvent={this.state.lastEvent}
                  // TODO: convert to use route path segment:
                  // allowDotClick={!['compare', 'catalog'].includes(activeView)}
                  allowDotClick
                  dotClickDate={this.state.dotClickDate}
                />
              </div>
              <div id="below-timeline">
                <div id="measure-available-width">  </div>
                <main>
                  { legacyResources && (
                    <Switch>
                      <Route path={`${PATIENT_MODE_SEGMENT}/:participantId/summary`}>
                        <SummaryView
                          resources={legacyResources}
                          dates={dates}
                          categories={categories}
                          providers={providers}
                        />
                      </Route>
                      <Route path={`${PATIENT_MODE_SEGMENT}/:participantId/catalog`}>
                        <CatalogView
                          resources={this.props.resources}
                          totalResCount={totalResCount}
                          dates={dates}
                          categories={categories}
                          providers={providers}
                          catsEnabled={activeCategories}
                          provsEnabled={activeProviders}
                          thumbLeftDate={thumbLeftDate}
                          thumbRightDate={thumbRightDate}
                        />
                      </Route>
                      <Route path={`${PATIENT_MODE_SEGMENT}/:participantId/compare`}>
                        <CompareView
                          resources={this.props.resources}
                          totalResCount={totalResCount}
                          dates={dates}
                          categories={categories}
                          providers={providers}
                          catsEnabled={activeCategories}
                          provsEnabled={activeProviders}
                          thumbLeftDate={thumbLeftDate}
                          thumbRightDate={thumbRightDate}
                        />
                      </Route>
                      <Route path={`${PATIENT_MODE_SEGMENT}/:participantId/timeline`}>
                        <ContentPanel
                          open
                          catsEnabled={activeCategories}
                          provsEnabled={activeProviders}
                          dotClickFn={this.onDotClick}
                          containerClassName="content-panel-absolute"
                          topBoundFn={this.calcContentPanelTopBound}
                          bottomBoundFn={this.calcContentPanelBottomBound}
                          // context, nextPrevFn added in StandardFilters
                          thumbLeftDate={thumbLeftDate}
                          thumbRightDate={thumbRightDate}
                          resources={legacyResources}
                          providers={providers}
                          totalResCount={totalResCount}
                          viewName="Report"
                          viewIconClass="longitudinal-view-icon"
                        />
                      </Route>
                      <Route path={`${PATIENT_MODE_SEGMENT}/:participantId/collections`}>
                        <Collections />
                      </Route>
                      <Route path={`${PATIENT_MODE_SEGMENT}/:participantId/:activeView?`}>
                        <Redirect
                          push
                          to={`/${patientMode}/${participantId}/summary`}
                        />
                      </Route>
                    </Switch>
                  )}
                </main>
              </div>
            </div>
            { hasCardListRight && <div id="details-right" /> }
          </div>
          <PageFooter resources={legacyResources} />
        </div>
      </DiscoveryContext.Provider>
    );
  }
}

// if using React.memo, there's a proptype warning for Route:
const DiscoveryAppHOC = (props) => {
  const [resources, setResources] = useRecoilState(resourcesState);
  const [timeFilters, updateTimeFilters] = useRecoilState(timeFiltersState);
  const activeCategories = useRecoilValue(activeCategoriesState);
  const activeProviders = useRecoilValue(activeProvidersState);

  useEffect(() => {
    function fetchData() {
      // set loading state; other fields in state remain as default:
      setResources({
        ...resources,
        loading: true,
      });

      const { match: { params: { patientMode, participantId } } } = props;

      const dataUrl = `${config.serverUrl}/${patientMode === 'uploaded' ? 'data/download' : 'participants'}/${participantId}`;

      get(dataUrl).then((response) => {
        // TODO: break-out into dedicated reducer function that uses memoized selectors:
        const raw = response.data;
        const normalized = normalizeResourcesAndInjectPartipantId(participantId)(response.data);
        if (normalized.length === 0) {
          throw new Error('Invalid Participant ID');
        }
        const legacy = generateLegacyResources(raw, normalized, participantId);
        const totalResCount = legacy.transformed.filter((elt) => elt.category !== 'Patient').length;
        // TODO: records (as dictionary) could be built direcetly, without intersitial "normalized" ?
        const records = generateRecordsDictionary(normalized);
        // TODO: should providers and categories be dedicated recoil states, derived from "records" ?
        const providers = extractProviders(records);
        const categories = extractCategories(records);

        setResources({
          ...resources,
          raw,
          records,
          totalResCount,
          providers,
          categories,
          legacy,
        });

        // TODO: migrate this call to recoil.js so it is automatically derived from resources.legacy, using DefaultValue api ?
        updateTimeFilters({
          ...computeFilterState(legacy),
        });
      }).catch((error) => {
        setResources({
          ...resources,
          loading: false,
          error,
        });
      });
    }
    fetchData();
  }, []); // empty array for dependency: invoke only when mounted.

  return (
    <DiscoveryApp
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      resources={resources}
      activeCategories={activeCategories}
      activeProviders={activeProviders}
      timeFilters={timeFilters}
      updateTimeFilters={updateTimeFilters}
    />
  );
};

DiscoveryAppHOC.propTypes = DiscoveryApp.propTypes;

export default DiscoveryAppHOC;
