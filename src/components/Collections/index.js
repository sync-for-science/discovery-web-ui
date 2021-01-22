import React from 'react';
import PropTypes from 'prop-types';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';


import RecordCard from '../cards/RecordCard'
import { resourcesState } from '../DiscoveryApp';
import PersistentDrawerRight from '../ContentPanel/Drawer';
// import FhirTransform from '../../FhirTransform';
// import { tryWithDefault } from '../../util';
// import { log } from '../../utils/logger';
import { normalizeResponseResources } from '../DiscoveryApp/Api';

const useStyles = makeStyles({
  root: {
    // minWidth: 275,
    border: '1px solid red',
    margin: '10px',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

const CardList = ({ normalized }) => {
  if (!normalized) {
    return null;
  }

  const record = normalized.filter(element => element.data.resourceType === 'Condition')
  // const record = normalized.filter(element => element.data.id === 'f974c2e4-d8d9-433d-90d7-0fc112d1137f')
  // return record.map((r, i) => <RecordCard key={i} resource={r} />);
  return normalized.map((r, i) => <RecordCard key={i} resource={r} />);
};

const Collections = (props) => {
  const resources = useRecoilValue(resourcesState);

  console.error('resources: ', resources);
  let normalized;
  if ((resources && resources.data)) {
    console.error('xxx resources.data: ', (resources.data));

    normalized = normalizeResponseResources(resources.data);
    console.error('xxx normalized resources: ', normalized);

    console.error('xxx normalized resources[0]: ', JSON.stringify(normalized[0], null, '  '));
  }
  return (
    <div>
      <h3>COLLECTIONS</h3>
      <div className="collections-content">
        <pre>
          { JSON.stringify(normalized, null, '  ') }
        </pre>
      </div>
      <PersistentDrawerRight>
        <div className="card-list">
          <CardList
            // resources={resources}
            normalized={normalized}
          />
        </div>
      </PersistentDrawerRight>
    </div>
  );
};

export default React.memo(Collections);
