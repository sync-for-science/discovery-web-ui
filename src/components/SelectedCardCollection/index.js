import React from 'react';
import { useRecoilValue } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';

import { resourcesState } from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';
import CardsForCategory from './CardsForCategory';
import CollectionSwitcher from '../Collections/CollectionSwitcher';

const useStyles = makeStyles((theme) => ({
  collectionSwitcher: {
    padding: '8px 16px',
    backgroundColor: theme.palette.primary.main,
    height: '40px',
    display: 'flex',
    alignItems: 'center',
  },
}));

const SelectedCardCollection = () => {
  const classes = useStyles();
  const resources = useRecoilValue(resourcesState);

  const { categories } = resources;

  return (
    <PersistentDrawerRight>
      <div className={classes.collectionSwitcher}>
        <CollectionSwitcher />
      </div>
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
