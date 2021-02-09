import React from 'react';
import Grid from '@material-ui/core/Grid';

import CollectionsList from './CollectionsList';
import CollectionDisplay from './CollectionDisplay';

const Collections = () => (
  <Grid container spacing={2}>
    <Grid style={{ paddingLeft: '0px' }} item xs={2}>
      <CollectionsList />
    </Grid>
    <Grid item xs={10}>
      <CollectionDisplay />
    </Grid>
  </Grid>
);

export default React.memo(Collections);
