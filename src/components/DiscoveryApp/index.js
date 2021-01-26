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
import TilesView from '../TilesView';
import Collections from '../Collections';
import PageFooter from '../PageFooter';
import {
  normalizeResourcesAndInjectPartipantId, generateRecordsDictionary, generateLegacyResources, computeFilterState, extractProviders, extractCategories,
} from './Api';
import {
  resourcesState, filtersState, activeCategoriesState, activeProvidersState,
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
    lastEvent: null,
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

    lastTileSelected: null, // TilesView & CompareView
    savedSelectedTiles: null, // TilesView & CompareView
    lastSavedSelectedTiles: null, // TilesView & CompareView
    viewAccentDates: [], // TilesView & CompareView
    viewLastAccentDates: [], // TilesView & CompareView
    highlightedResources: [], // TilesView & CompareView
    lastHighlightedResources: [], // TilesView & CompareView
    onlyMultisource: false, // TilesView & CompareView

    onlyAnnotated: false, // ContentPanel
  }

  componentDidMount() {
    window.addEventListener('resize', this.onEvent);
    window.addEventListener('keydown', this.onEvent);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onEvent);
    window.removeEventListener('keydown', this.onEvent);
  }

  onEvent = (event) => {
    this.setState({ lastEvent: event });
  }

  // Record thumb positions as returned from StandardFilters
  setDateRange = (minDate, maxDate) => {
    this.props.setFilters({
      ...this.props.filters,
      thumbLeftDate: minDate,
      thumbRightDate: maxDate,
    });
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

    const { match: { params: { activeView = 'summary', participantId } } } = this.props;

    const isSummary = activeView === 'summary';

    const {
      resources, activeCategories, activeProviders, filters,
    } = this.props;

    const { dates, thumbLeftDate, thumbRightDate } = filters;

    const {
      patient, totalResCount, providers, categories,
    } = resources;

    return (
      <DiscoveryContext.Provider value={{ ...this.state, ...this.props.filters }}>
        <div className="discovery-app">
          <PageHeader
            participantId={participantId}
          />
          <div className="outer-container">
            <div id="left-nav" style={{ display: isSummary ? 'none' : 'block' }} />
            <div className="inner-container">
              <div className="standard-filters" style={{ display: isSummary ? 'none' : 'block' }}>
                <StandardFilters
                  activeView={activeView}
                  resources={legacyResources}
                  dates={dates}
                  categories={categories}
                  catsEnabled={activeCategories}
                  providers={providers}
                  provsEnabled={activeProviders}
                  dateRangeFn={this.setDateRange}
                  lastEvent={this.state.lastEvent}
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
                      <Route path="/participant/:participantId/summary">
                        <SummaryView
                          activeView={activeView}
                          resources={legacyResources}
                          dates={dates}
                          categories={categories}
                          providers={providers}
                        />
                      </Route>
                      <Route path="/participant/:participantId/catalog">
                        <TilesView
                          activeView={activeView}
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
                      <Route path="/participant/:participantId/compare">
                        <CompareView
                          activeView={activeView}
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
                      <Route path="/participant/:participantId/timeline">
                        <ContentPanel
                          open
                          activeView={activeView}
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
                          patient={patient}
                          providers={providers}
                          totalResCount={totalResCount}
                          viewName="Report"
                          viewIconClass="longitudinal-view-icon"
                        />
                      </Route>
                      <Route path="/participant/:participantId/collections">
                        <Collections />
                      </Route>
                      <Route
                        path="/participant/:participantId/:activeView?"
                      >
                        <Redirect
                          push
                          to={`/participant/${participantId}/summary`}
                        />
                      </Route>
                    </Switch>
                  )}
                </main>
              </div>
            </div>
            { !isSummary && <div id="details-right" /> }
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
  const [filters, setFilters] = useRecoilState(filtersState);
  const activeCategories = useRecoilValue(activeCategoriesState);
  const activeProviders = useRecoilValue(activeProvidersState);

  useEffect(() => {
    function fetchData() {
      // set loading state; other fields in state remain as default:
      setResources({
        ...resources,
        loading: true,
      });

      const { match: { params: { id, participantId } } } = props;

      const dataUrl = id ? `${config.serverUrl}/data/download/${id}`
        : `${config.serverUrl}/participants/${participantId}`;

      get(dataUrl).then((response) => {
        // TODO: break-out into dedicated reducer function that uses memoized selectors:
        const raw = response.data;
        const normalized = normalizeResourcesAndInjectPartipantId(participantId)(response.data);
        if (normalized.length === 0) {
          throw new Error('Invalid Participant ID');
        }
        const legacy = generateLegacyResources(raw, normalized, participantId);
        // const patient = legacy.pathItem('[category=Patient]');
        const patient = normalized.find(({ category }) => category === 'Patient');
        const totalResCount = legacy.transformed.filter((elt) => elt.category !== 'Patient').length;
        const records = generateRecordsDictionary(normalized);
        const providers = extractProviders(records);
        const categories = extractCategories(records);

        setResources({
          ...resources,
          raw,
          normalized,
          records,
          totalResCount,
          patient,
          providers,
          categories,
          legacy,
        });

        setFilters({
          ...filters,
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
      filters={filters}
      setFilters={setFilters}
    />
  );
};

DiscoveryAppHOC.propTypes = DiscoveryApp.propTypes;

export default DiscoveryAppHOC;
