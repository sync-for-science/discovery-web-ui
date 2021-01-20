import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, Redirect } from 'react-router-dom';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
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
import Unimplemented from '../Unimplemented';
import PageFooter from '../PageFooter';
import Api, { normalizeResourcesAndInjectPartipantId, generateLegacyResources } from './Api';

import DiscoveryContext from '../DiscoveryContext';

//
// Render the top-level Discovery application page
//
class DiscoveryApp extends React.PureComponent {
  constructor(props) {
    super(props);
    const { match: { params: { participantId } } } = this.props;
    this.api = new Api(participantId, (obj) => this.setState(obj));
  }

  static propTypes = {
    match: PropTypes.object,
  }

  state = {
    resources: null, // Will be set to an instance of FhirTransform
    totalResCount: null, // Number of resources excluding Patient resources
    dates: null, // Collection of dates for views:
    //    allDates
    //    minDate     Earliest date we have data for this participant
    //    startDate     Jan 1 of minDate's year
    //    maxDate     Latest date we have data for this participant
    //    endDate     Dec 31 of maxDate's year
    searchRefs: [], // Search results to highlight
    searchMatchWords: [], // Search results matching words
    laserSearch: false, // Laser Search enabled?
    isLoading: false,
    fetchError: null, // Possible axios error object
    lastEvent: null,
    thumbLeftDate: null,
    thumbRightDate: null,
    dotClickDate: null, // dot click from ContentPanel
    catsEnabled: null,
    provsEnabled: null,
    providers: [],

    // Shared Global Context
    updateGlobalContext: (updates) => this.setState(updates),

    themeName: null, // PageHeader

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

    this.setState({ isLoading: true });

    const { match: { params: { id, participantId } } } = this.props;

    // Check for uploaded data
    const dataUrl = id ? `${config.serverUrl}/data/download/${id}`
      : `${config.serverUrl}/participants/${participantId}`;

    // Get the merged dataset and transform it using topTemplate
    this.api.fetch(dataUrl);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onEvent);
    window.removeEventListener('keydown', this.onEvent);
  }

  onEvent = (event) => {
    this.setState({ lastEvent: event });
  }

  // Return sorted array of all populated category names for this participant
  get categories() {
    const cats = {};
    if (this.state.resources) {
      for (const resource of this.state.resources.transformed) {
        if (resource.category === 'Patient') {
          // Ignore
        } else if (Unimplemented.unimplementedCats.includes(resource.category)) {
          // Add the "Unimplemented" category
          cats[Unimplemented.catName] = null;
        } else {
          // Add the found category
          cats[resource.category] = null;
        }
      }
    }
    return Object.keys(cats).sort();
  }

  // Return sorted array of all provider names for this participant
  get providers() {
    const provs = {};
    if (this.state.resources) {
      for (const resource of this.state.resources.transformed) {
        // Add the found provider
        provs[resource.provider] = null;
      }
    }
    return Object.keys(provs).sort();
  }

  setEnabled = (catsEnabled, provsEnabled) => {
    this.setState({
      catsEnabled,
      provsEnabled,
    });
  }

  // Record thumb positions as returned from StandardFilters
  setDateRange = (minDate, maxDate) => {
    this.setState({ thumbLeftDate: minDate, thumbRightDate: maxDate });
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

  get viewCategories() {
    return this.categories;
  }

  get initialCats() {
    const cats = {};

    for (const cat of this.categories) {
      cats[cat] = true;
    }

    return cats;
  }

  get initialProvs() {
    return this.providers.reduce((res, prov) => { res[prov] = true; return res; }, {});
  }

  render() {
    if (this.state.fetchError) {
      return <p>{ `DiscoveryApp: ${this.state.fetchError.message}` }</p>;
    }

    if (this.state.isLoading) {
      return <p>Loading ...</p>;
    }

    const { match: { params: { activeView = 'summary', participantId } } } = this.props;

    const isSummary = activeView === 'summary';

    return (
      <DiscoveryContext.Provider value={this.state}>
        { this.state.themeName && <link rel="stylesheet" type="text/css" href={`/themes/${this.state.themeName}.css`} /> }
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
                  resources={this.state.resources}
                  dates={this.state.dates}
                  categories={this.viewCategories}
                  catsEnabled={this.initialCats}
                  providers={this.providers}
                  provsEnabled={this.initialProvs}
                  enabledFn={this.setEnabled}
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
                  { this.state.resources && (
                    <Switch>
                      <Route path="/participant/:participantId/summary">
                        <SummaryView
                          activeView={activeView}
                          resources={this.state.resources}
                          dates={this.state.dates}
                          categories={this.categories}
                          providers={this.providers}
                          lastEvent={this.state.lastEvent}
                        />
                      </Route>
                      <Route path="/participant/:participantId/catalog">
                        <TilesView
                          activeView={activeView}
                          resources={this.state.resources}
                          totalResCount={this.state.totalResCount}
                          dates={this.state.dates}
                          categories={this.categories}
                          providers={this.providers}
                          catsEnabled={this.state.catsEnabled}
                          provsEnabled={this.state.provsEnabled}
                          thumbLeftDate={this.state.thumbLeftDate}
                          thumbRightDate={this.state.thumbRightDate}
                          lastEvent={this.state.lastEvent}
                        />
                      </Route>
                      <Route path="/participant/:participantId/compare">
                        <CompareView
                          activeView={activeView}
                          resources={this.state.resources}
                          totalResCount={this.state.totalResCount}
                          dates={this.state.dates}
                          categories={this.categories}
                          providers={this.providers}
                          catsEnabled={this.state.catsEnabled}
                          provsEnabled={this.state.provsEnabled}
                          thumbLeftDate={this.state.thumbLeftDate}
                          thumbRightDate={this.state.thumbRightDate}
                          lastEvent={this.state.lastEvent}
                        />
                      </Route>
                      <Route path="/participant/:participantId/timeline">
                        <ContentPanel
                          open
                          activeView={activeView}
                          catsEnabled={this.state.catsEnabled}
                          provsEnabled={this.state.provsEnabled}
                          dotClickFn={this.onDotClick}
                          containerClassName="content-panel-absolute"
                          topBoundFn={this.calcContentPanelTopBound}
                          bottomBoundFn={this.calcContentPanelBottomBound}
                          // context, nextPrevFn added in StandardFilters
                          thumbLeftDate={this.state.thumbLeftDate}
                          thumbRightDate={this.state.thumbRightDate}
                          resources={this.state.resources}
                          totalResCount={this.state.totalResCount}
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
          <PageFooter resources={this.state.resources} />
        </div>
      </DiscoveryContext.Provider>
    );
  }
}

export const resourcesState = atom({
  key: 'resourcesState', // unique ID (with respect to other atoms/selectors)
  default: {
    loading: false,
    error: null,
    raw: null,
    normalized: null,
    legacy: null,
  },
});

export const filtersState = atom({
  key: 'filtersState', // unique ID (with respect to other atoms/selectors)
  default: {
  },
});

// if using React.memo, there's a proptype warning for Route:
const DiscoveryAppHOC = (props) => {
  const [resources, setResources] = useRecoilState(resourcesState);
  const [filters, setFilters] = useRecoilState(filtersState);

  useEffect(() => {
    function fetchData() {
      setResources({
        ...resources,
        loading: true,
      });

      const { match: { params: { id, participantId } } } = props;

      const dataUrl = id ? `${config.serverUrl}/data/download/${id}`
        : `${config.serverUrl}/participants/${participantId}`;

      get(dataUrl).then((response) => {
        const raw = response.data;
        const normalized = normalizeResourcesAndInjectPartipantId(participantId)(response.data);
        const legacy = generateLegacyResources(raw, normalized, participantId);
        setResources({
          ...resources,
          raw,
          normalized,
          legacy,
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
    />
  );
};

DiscoveryAppHOC.propTypes = DiscoveryApp.propTypes;

export default DiscoveryAppHOC;
