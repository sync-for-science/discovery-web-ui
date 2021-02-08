import React from 'react';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useRecoilValue } from 'recoil';

import { allCollectionsState, filteredActiveCollectionState, resourcesState } from '../../recoil/index';
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

const CollectionDisplay = () => {
  const classes = useStyles();
  // const collectionName = selected ? selected.title : 'Untitled Collection';
  const resources = useRecoilValue(resourcesState);
  const { categories } = resources;
  const filteredActiveCollection = useRecoilValue(filteredActiveCollectionState);
  const allCollections = useRecoilValue(allCollectionsState);

  const { activeCollectionId, collections } = allCollections;
  const activeCollectionLabel = collections[activeCollectionId].label;

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="s4sHeader">{activeCollectionLabel}</Typography>
      </div>
      <div className={classes.bodyContainer}>
        <div className={classes.recordCardsContainer}>
          <div style={{ display: 'flex', overflowX: 'scroll', height: '100%' }}>
            {categories.map((categoryLabel) => {
              if (filteredActiveCollection[categoryLabel] && filteredActiveCollection[categoryLabel].filteredCollectionCount) {
                return (
                  <div key={`groupedRecordCard-${categoryLabel}`} style={{ margin: '5px' }}>
                    <div style={{ height: '95%', overflowY: 'scroll', paddingRight: '10px' }}>
                      <CardsForCategory
                        categoryLabel={categoryLabel}
                      />
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
        <div className={classes.collectionNotes}>
          <CollectionsNoteEditor
            activeCollectionId={activeCollectionId}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(CollectionDisplay);
