import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, Redirect } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { get } from 'axios';

import './DiscoveryApp.css';
import config from '../../config.js';
import PageHeader from '../PageHeader';
import StandardFilters from '../StandardFilters';
import SummaryView from '../SummaryView';
import CompareView from '../CompareView';
import CatalogView from '../CatalogView';
import Collections from '../Collections';
import { PATIENT_MODE_SEGMENT } from '../../index';
import {
  normalizeResourcesAndInjectPartipantId, generateRecordsDictionary, generateLegacyResources, extractProviders, extractCategories,
} from '../../utils/api';
import { resourcesState } from '../../recoil';

import CategoryFilter from '../filters/CategoryFilter';
import ProviderFilter from '../filters/ProviderFilter';

class DiscoveryApp extends React.PureComponent {
  static propTypes = {
    match: PropTypes.object,
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

    return (
      <div className="discovery-app">
        <PageHeader
          patientMode={patientMode}
          participantId={participantId}
        />
        <div id="outer-container" className={`route-${activeView}`}>
          {!isSummary && (
            <div id="left-filters">
              <CategoryFilter />
              <ProviderFilter />
            </div>
          )}
          <div id="inner-container">
            <div className="standard-filters" style={{ display: isSummary ? 'none' : 'block' }}>
              <StandardFilters
                activeView={activeView} // trigger timeline resizing when route changes
              />
            </div>
            <div id="below-timeline">
              <div id="measure-available-width">  </div>
              <main>
                { legacyResources && (
                  <Switch>
                    <Route path={`${PATIENT_MODE_SEGMENT}/:participantId/summary`}>
                      <SummaryView />
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
      </div>
    );
  }
}

// if using React.memo, there's a proptype warning for Route:
const DiscoveryAppHOC = (props) => {
  const [resources, setResources] = useRecoilState(resourcesState);

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
