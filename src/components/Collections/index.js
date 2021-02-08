import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { useRecoilValue } from 'recoil';

import {
  resourcesState,
  activeCollectionState, filteredActiveCollectionState,
} from '../../recoil';

import CollectionsList from './CollectionsList';
import CollectionDisplay from './CollectionDisplay';

/* eslint-disable react/jsx-one-expression-per-line */
const Collections = () => {
  const resources = useRecoilValue(resourcesState);

  const dummyCollections = [
    {
      id: 0,
      title: 'Diabetes',
    },
    {
      id: 1,
      title: 'High Blood Pressure',
    },
    {
      id: 2,
      title: 'Immunizations',
      recordCardIds: {},
    },
    {
      id: 3,
      title: 'Sprains',
    },
  ];

  // setState for dummyCollections to give appearance of multiple collections
  const [selected, setSelected] = useState(null);
  const activeCollection = useRecoilValue(activeCollectionState);
  console.info('activeCollection: ', JSON.stringify(activeCollection, null, '  '));

  const { records } = resources;

  return (
    <>
      <Grid container spacing={2}>
        <Grid style={{ paddingLeft: '0px' }} item xs={2}>
          <CollectionsList />
        </Grid>
        <Grid item xs={10}>
          <CollectionDisplay
            selected={selected}
            records={records}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default React.memo(Collections);
