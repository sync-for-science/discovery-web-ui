import React, { useState, useRef } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { useRecoilState } from 'recoil';

import { TextField } from '@material-ui/core';
import { allCollectionsState } from '../../recoil';
import CollectionActions from './CollectionActions';

const useStyles = makeStyles((_theme) => ({
  formControl: {
    width: '100%',
  },
  inputField: {
    backgroundColor: '#fff',
  },
}));

const CustomInputBase = withStyles(() => ({
  root: {
    color: '#fff',
  },
}))(InputBase); // for some reason, this disables the borderBottom in Select

const CollectionSwitcher = () => {
  const classes = useStyles();

  const [allCollections, setAllCollections] = useRecoilState(allCollectionsState);
  const { activeCollectionId, collections } = allCollections;
  const [showRenameField, setShowRenameField] = useState(false);

  const handleChange = (event) => {
    const { target: { value: collectionId } } = event;
    setAllCollections((previousState) => {
      const { collections } = previousState;
      return {
        activeCollectionId: collectionId,
        collections,
      };
    });
  };

  const renameInput = useRef(null);

  const saveRenameCollection = () => {
    setAllCollections((previousState) => {
      const { collections } = previousState;
      return {
        activeCollectionId,
        collections: {
          ...collections,
          [activeCollectionId]: {
            ...collections[activeCollectionId],
            label: renameInput.current.value,
          },
        },
      };
    });
    setShowRenameField(false);
  };

  const createNewCollectionState = () => {
    setAllCollections((previousState) => {
      const { collections } = previousState;
      const nowUTC = (new Date()).toISOString();
      return {
        activeCollectionId: nowUTC,
        collections: {
          ...collections,
          [nowUTC]: {
            label: 'New Collection',
            uuids: {},
            recentlyAddedUuids: {},
          },
        },
      };
    });
  };

  const createNewCollection = async () => {
    await createNewCollectionState(); // need to await NewCollectionState so renameInput.current.value has latest collections
    setShowRenameField(true);
  };

  const clearCurrentCollection = () => {
    setAllCollections((previousState) => {
      const { collections } = previousState;
      return {
        activeCollectionId,
        collections: {
          ...collections,
          [activeCollectionId]: {
            label: collections[activeCollectionId].label,
            recentlyAddedUuids: {},
            uuids: {},
          },
        },
      };
    });
  };

  let displayCollection;
  if (!showRenameField) {
    displayCollection = (
      <FormControl
        variant="standard" // filled outlined standard
        color="secondary"
        className={classes.formControl}
      >
        <Select
          label="Active Collection"
          labelId="select-active-collection-label"
          id="select-active-collection"
          value={activeCollectionId}
          MenuProps={{ MenuListProps: { disablePadding: true } }}
          input={<CustomInputBase />}
          onChange={handleChange}
        >
          {Object.entries(collections).map(([collectionId, { label }]) => (
            <MenuItem
              key={collectionId}
              value={collectionId}
            >
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  } else {
    displayCollection = (
      <TextField
        size="small"
        fullWidth
        InputProps={{
          className: classes.inputField,
        }}
        inputRef={renameInput}
        defaultValue={collections[activeCollectionId].label}
      />
    );
  }

  return (
    <>
      {displayCollection}
      <CollectionActions
        showRenameField={showRenameField}
        setShowRenameField={setShowRenameField}
        saveRenameCollection={saveRenameCollection}
        createNewCollection={createNewCollection}
        clearCurrentCollection={clearCurrentCollection}
      />
    </>
  );
};

export default React.memo(CollectionSwitcher);
