import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { useRecoilState } from 'recoil';

import { allCollectionsState } from '../../recoil';

const useStyles = makeStyles((_theme) => ({
  formControl: {
    width: '100%',
  },
}));

const CollectionSwitcher = () => {
  const classes = useStyles();

  const [allCollections, setAllCollections] = useRecoilState(allCollectionsState);
  const { activeCollectionId, collections } = allCollections;

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

  return (
    <FormControl
      variant="standard" // filled outlined standard
      color="secondary"
      className={classes.formControl}
    >
      <InputLabel
        id="select-active-collection-label"
      >
        Active Collection
      </InputLabel>
      <Select
        label="Active Collection"
        labelId="select-active-collection-label"
        id="select-active-collection"
        value={activeCollectionId}
        MenuProps={{ MenuListProps: { disablePadding: true } }}
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
};

export default React.memo(CollectionSwitcher);
