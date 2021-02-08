import React from 'react';
import { useRecoilValue } from 'recoil';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/core/styles';
import {
  resourcesState, allRecordIds, filteredActiveCollectionState,
} from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';
import CardsForCategory from './CardsForCategory';

const useStyles = makeStyles(() => ({
  appBar: {
    minWidth: 'initial',
  },
}));

const CardListHeader = ({ filteredCollectionCount, totalCount }) => {
  const classes = useStyles();
  return (
    <AppBar
      position="relative"
      className={classes.appBar}
    >
      <Typography variant="card-list-header">
        Displaying {filteredCollectionCount} of {totalCount} records {/* eslint-disable-line react/jsx-one-expression-per-line */}
      </Typography>
    </AppBar>
  );
};

const SelectedCardCollection = () => {
  const recordIds = useRecoilValue(allRecordIds);
  const resources = useRecoilValue(resourcesState);
  const filteredActiveCollection = useRecoilValue(filteredActiveCollectionState);

  const { categories } = resources;

  return (
    <PersistentDrawerRight>
      <CardListHeader
        filteredCollectionCount={filteredActiveCollection.filteredCollectionCount}
        totalCount={recordIds.length}
      />
      <div className="card-list">
        {categories.map((categoryLabel) => (
          <CardsForCategory
            key={categoryLabel}
            categoryLabel={categoryLabel}
          />
        ))}
      </div>
    </PersistentDrawerRight>
  );
};

export default React.memo(SelectedCardCollection);
