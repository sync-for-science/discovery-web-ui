import React, { useRef } from 'react';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';
import { useRecoilState } from 'recoil';
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
  collectionSelector: {
    margin: '10px 0',
    padding: '8px',
    display: 'flex',
    cursor: 'pointer',
  },
  selected: {
    backgroundColor: 'lightblue',
  },
  newCollectionField: {
    margin: '16px 0 8px 0',
  },
}));

const CollectionTitle = ({
  label, activeCollectionId, collectionId, handleSelect,
}) => {
  const classes = useStyles();
  const isActiveCollection = (activeCollectionId === collectionId);
  const selectedStyle = isActiveCollection ? classes.selected : '';
  // TODO: replace following with MUI select list or combo box?
  return (
    <MenuItem
      className={`${classes.collectionSelector} ${selectedStyle}`}
      disabled={isActiveCollection}
      onClick={handleSelect}
    >
      <Typography variant="s4sHeader">{label}</Typography>
    </MenuItem>
  );
};

const CollectionsList = () => {
  const classes = useStyles();
  const collectionInputRef = useRef(null);
  const [allCollections, setAllCollections] = useRecoilState(allCollectionsState);
  const setActiveCollection = (collectionId) => {
    setAllCollections((previousState) => {
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
      setAllCollections((previousState) => {
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

export default React.memo(CollectionsList);
