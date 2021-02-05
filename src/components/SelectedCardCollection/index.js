import React from 'react';
import { useRecoilValue } from 'recoil';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/core/styles';
import {
  resourcesState, allRecordIds, groupedRecordIdsInCurrentCollectionState,
} from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';
import CardsForCategory from './CardsForCategory';

const useStyles = makeStyles(() => ({
  appBar: {
    minWidth: 'initial',
  },
}));

const CardListHeader = ({ collectionCount, totalCount }) => {
  const classes = useStyles();
  return (
    <AppBar
      position="relative"
      className={classes.appBar}
    >
      <Typography variant="card-list-header">
        Displaying {collectionCount} of {totalCount} records {/* eslint-disable-line react/jsx-one-expression-per-line */}
      </Typography>
    </AppBar>
  );
};

const SelectedCardCollection = () => {
  const recordIds = useRecoilValue(allRecordIds);
  const resources = useRecoilValue(resourcesState);
  const groupedRecordIdsBySubtype = useRecoilValue(groupedRecordIdsInCurrentCollectionState);

  const { categories } = resources;

  return (
    <PersistentDrawerRight>
      <CardListHeader
        collectionCount={groupedRecordIdsBySubtype.totalFilteredRecordCount}
        totalCount={recordIds.length}
      />
      <div className="card-list">
        {categories.map((category) => (
          <CardsForCategory
            key={category}
            category={category}
          />
        ))}
      </div>
    </PersistentDrawerRight>
  );
};

export default React.memo(SelectedCardCollection);
