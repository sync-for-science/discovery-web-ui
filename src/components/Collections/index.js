import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { useRecoilValue } from 'recoil';

import {
  groupedRecordIdsState, resourcesState, patientRecord,
} from '../../recoil';
import CollectionsList from './CollectionsList';
import CollectionDisplay from './CollectionDisplay';

/* eslint-disable react/jsx-one-expression-per-line */
const Collections = () => {
  const groupedRecordIds = useRecoilValue(groupedRecordIdsState);
  const resources = useRecoilValue(resourcesState);
  const patient = useRecoilValue(patientRecord);

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

  const { records } = resources;

  return (
    <>
      <Grid container spacing={2}>
        <Grid style={{ paddingLeft: '0px' }} item xs={2}>
          <CollectionsList
            collections={dummyCollections}
            selected={selected}
            setSelected={setSelected}
          />
        </Grid>
        <Grid item xs={10}>
          <CollectionDisplay
            selected={selected}
            records={records}
            groupedRecordIds={groupedRecordIds}
            patient={patient}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default React.memo(Collections);
