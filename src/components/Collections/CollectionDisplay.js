import React from 'react';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useRecoilValue } from 'recoil';

import { activeCategoriesState, filteredActiveCollectionState, resourcesState } from '../../recoil/index';
import CollectionsNoteEditor from '../notes/CollectionsNoteEditor';
import CardsForCategory from '../SelectedCardCollection/CardsForCategory';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '750px',
    borderRadius: '10px',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    padding: '5px',
  },
  bodyContainer: {
    padding: '20px',
    height: 'calc( 100% - 70px )',
  },
  recordCardsContainer: {
    height: '70%',
    overflow: 'hidden',
    borderBottom: '1px solid lightgray',
  },
  collectionNotes: {
    height: 'calc(30% - 25px)',
    marginTop: '20px',
    overflowY: 'scroll',
  },
}));

const CollectionDisplay = ({
  selected,
}) => {
  // const activeCategories = useRecoilValue(activeCategoriesState);
  const classes = useStyles();
  const collectionName = selected ? selected.title : 'Untitled Collection';
  const resources = useRecoilValue(resourcesState);
  const { categories } = resources;
  const filteredActiveCollection = useRecoilValue(filteredActiveCollectionState);

  const displayRecordCards = () => categories.map((categoryLabel) => {
    if (filteredActiveCollection[categoryLabel].filteredCollectionCount) {
      return (
        <div key={`groupedRecordCard-${categoryLabel}`} style={{ margin: '5px' }}>
          <div style={{ width: '400px' }}>
            <Typography variant="s4sHeader">{categoryLabel}</Typography>
          </div>
          <div style={{ height: '95%', overflowY: 'scroll', paddingRight: '10px' }}>
            <CardsForCategory
              categoryLabel={categoryLabel}
            />
          </div>
        </div>
      );
    }
    return null;
  });

  let collectionData;
  if (selected) {
    if (selected.id !== 2) {
      collectionData = <Typography variant="s4sHeader">No RecordCards in this collection</Typography>;
    } else {
      collectionData = (
        <div style={{ display: 'flex', overflowX: 'scroll', height: '100%' }}>
          {displayRecordCards()}
        </div>
      );
    }
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="s4sHeader">{collectionName}</Typography>
      </div>
      <div className={classes.bodyContainer}>
        <div className={classes.recordCardsContainer}>
          {collectionData}
        </div>
        <div className={classes.collectionNotes}>
          <CollectionsNoteEditor
            collectionName={collectionName}
          />
        </div>
      </div>
    </div>
  );
};

export default CollectionDisplay;
