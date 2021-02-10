import React, {useState, useRef, useEffect} from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import InputBase from '@material-ui/core/InputBase';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { useRecoilState } from 'recoil';

import { allCollectionsState } from '../../recoil';
import CollectionActions from './CollectionActions'
import { TextField } from '@material-ui/core';

const useStyles = makeStyles((_theme) => ({
  formControl: {
    width: '100%',
  },
  inputField: {
    backgroundColor: '#fff'
  }
}));

const CustomInputBase = withStyles(() => ({
  root: {
    color: '#fff'
  }
}))(InputBase); // for some reason, this disables the borderBottom in Select

const CollectionSwitcher = () => {
  const classes = useStyles();

  const [allCollections, setAllCollections] = useRecoilState(allCollectionsState);
  const { activeCollectionId, collections } = allCollections;
  const [showRenameField, setShowRenameField] = useState(false)

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

  const renameInput = useRef(null)

  const handleSaveRenameCollection = () => {
    setAllCollections((previousState) => {
      const { collections } = previousState;
      return {
        activeCollectionId,
        collections: {
          ...collections, 
          [activeCollectionId]: {
            label: renameInput.current.value,
            uuids: collections[activeCollectionId].uuids,
          },
        },
      };
    });
    setShowRenameField(false)
  }

  const handleNewCollectionState = () => {
    setAllCollections((previousState) => {
      const { collections } = previousState;
      const nowUTC = (new Date()).toISOString();
      return {
        activeCollectionId: nowUTC,
        collections: {
          ...collections, 
          [nowUTC]: {
            label: "New Collection",
            uuids: [],
          },
        },
      };
    });
  }

  const handleNewCollection = async () => {
    await handleNewCollectionState() // need to await NewCollectionState so renameInput.current.value has latest collections
    setShowRenameField(true)
  }

  let displayCollection
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
          inputProps={{ 'aria-label': 'Without label', }}
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
    )
  } else {
    debugger
    displayCollection = (
      <TextField 
        size="small" 
        fullWidth 
        InputProps={{
          className: classes.inputField
        }}
        inputRef={renameInput}
        defaultValue={collections[activeCollectionId].label}
      />
    )
  }

  return (
    <>
      {displayCollection}
      <CollectionActions 
        showRenameField={showRenameField}
        setShowRenameField={setShowRenameField}
        handleSaveRenameCollection={handleSaveRenameCollection}
        handleNewCollection={handleNewCollection}
      />
    </>
  );
};

export default React.memo(CollectionSwitcher);
