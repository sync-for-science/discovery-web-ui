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

  // const slice = normalized.slice(5, 6)

  const record = [normalized.find(element => element.data.id === '168ea212-2d23-46ac-9110-7c549c735477')]
  return record.map((r, i) => <RecordCard key={i} resource={r} />);
  return normalized.map((r) => <RecordCard resource={r} />);
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
