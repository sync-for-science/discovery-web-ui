import React, { useRef } from 'react';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
// import AddIcon from '@material-ui/icons/Add';
import { makeStyles } from '@material-ui/core/styles';
import { useRecoilValue, useRecoilState } from 'recoil';
import { allCollectionsState } from '../../recoil';

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
  body: {
    padding: '20px',
  },
  collectionTitle: {
    margin: '10px 0',
    display: 'flex',
    cursor: 'pointer',
  },
  selected: {
    backgroundColor: 'lightblue',
  },
  icon: {
    marginRight: '10px',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  newCollectionField: {
    margin: '16px 0 8px 0',
  },
}));

const CollectionTitle = ({
  label, activeCollectionId, collectionId, handleSelect,
}) => {
  const classes = useStyles();
  const selectedStyle = activeCollectionId === collectionId ? classes.selected : '';
  return (
    <div
      className={classes.collectionTitle}
      onClick={handleSelect}
    >
      {/* <div className={classes.icon}>
        <AddIcon fontSize="inherit" />
      </div> */}
      <div className={selectedStyle}>
        <Typography variant="s4sHeader">{label}</Typography>
      </div>
    </div>
  );
};

const CollectionsList = () => {
  const classes = useStyles();
  const collectionInputRef = useRef(null);
  const [allCollections, setAllCollections] = useRecoilState(allCollectionsState);
  // console.info('allCollections: ', JSON.stringify(allCollections, null, '  '));
  const setActiveCollection = (collectionId) => {
    setAllCollections((previousState) => {
      // console.error('handleAddNewCollection previousState: ', previousState);
      const { collections } = previousState;
      return {
        activeCollectionId: collectionId,
        collections,
      };
    });
  };

  const handleAddNewCollection = (_event) => {
    const newCollectionLabel = collectionInputRef?.current?.value;
    if (newCollectionLabel) {
      console.info('collectionInputRef: ', newCollectionLabel);
      setAllCollections((previousState) => {
        console.info('handleAddNewCollection previousState: ', JSON.stringify(previousState, null, '  '));
        const nowUTC = (new Date()).toISOString();
        return {
          activeCollectionId: previousState.activeCollectionId,
          collections: {
            ...previousState.collections,
            [nowUTC]: {
              label: newCollectionLabel,
              uuids: [],
            },
          },
        };
      });
      collectionInputRef.current.value = '';
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="s4sHeader">Collections</Typography>
      </div>
      <div className={classes.body}>
        {Object.entries(allCollections.collections).map(([collectionId, { label }]) => (
          <CollectionTitle
            key={collectionId}
            label={label}
            activeCollectionId={allCollections.activeCollectionId}
            collectionId={collectionId}
            handleSelect={(_event) => setActiveCollection(collectionId)}
          />
        ))}
        <div className={classes.newCollectionField}>
          <TextField
            placeholder="New Collection"
            size="small"
            inputRef={collectionInputRef}
          />
        </div>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          size="small"
          onClick={handleAddNewCollection}
        >
          Add
        </Button>
      </div>
    </div>
  );
};

export default CollectionsList;
