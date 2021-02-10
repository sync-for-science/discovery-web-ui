import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, Redirect } from 'react-router-dom';
import { useRecoilValue, useRecoilState } from 'recoil';
import { get } from 'axios';

import './DiscoveryApp.css';
import config from '../../config.js';
import PageHeader from '../PageHeader';
import StandardFilters from '../StandardFilters';
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
    dotClickDate: null, // dot click from ContentPanel

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

    const { dates, dateRangeStart, dateRangeEnd } = timeFilters;

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
                        <CatalogView />
                      </Route>
                      <Route path={`${PATIENT_MODE_SEGMENT}/:participantId/compare`}>
                        <CompareView />
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
