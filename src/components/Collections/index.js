import React from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

import CollectionsList from './CollectionsList';
import CollectionDisplay from './CollectionDisplay';

const useStyles = makeStyles(() => ({
  gridContainer: {
    width: 'calc(100vw - 170px)', // view width - left filters
  },
}));

const Collections = () => {
  const classes = useStyles();

  return (
    <Grid container spacing={2} className={classes.gridContainer}>
      <Grid item xs={2}>
        <CollectionsList />
      </Grid>
      <Grid item xs={10}>
        <CollectionDisplay />
      </Grid>
    </Grid>
  );
};

export default React.memo(Collections);
