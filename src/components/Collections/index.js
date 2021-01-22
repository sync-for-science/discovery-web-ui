import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import { connectToResources } from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';

const useStyles = makeStyles({
  root: {
    // minWidth: 275,
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
  const { loading, normalized } = props.resources;

  return (
    <div>
      <h3>COLLECTIONS</h3>
      <div>
        loading:
        { String(loading) }
      </div>
      <div className="collections-content">
        <pre>
          { JSON.stringify(normalized, null, '  ') }
        </pre>
      </div>
      <PersistentDrawerRight>
        <div className="card-list">
          <CardList
            normalized={normalized}
          />
        </div>
      </PersistentDrawerRight>
    </div>
  );
};

export default connectToResources(Collections);
