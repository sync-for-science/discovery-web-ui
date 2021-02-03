import React from 'react'
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import AddIcon from '@material-ui/icons/Add';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '750px', 
    borderRadius: '10px', 
    backgroundColor: 'white', 
    overflow: 'hidden'
  },
  header: {
    display: 'flex', 
    justifyContent: 'center', 
    backgroundColor: theme.palette.primary.main, 
    color: 'white',
    padding: '5px'
  },
  body: {
    padding: '20px'
  },
  collectionTitle: {
    margin: '10px 0',
    display: 'flex',
    cursor: 'pointer'
  },
  selected: {
    backgroundColor: 'lightblue'
  },
  icon: {
    marginRight: '10px',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center'
  },
  newCollectionField: {
    marginBottom: '30px'
  }
}));

const CollectionTitle = ({collection, selected, handleSelect}) => {
  const classes = useStyles()
  const selectedStyle = selected?.id === collection.id ? classes.selected : ""
  return (
    <div className={classes.collectionTitle} onClick={handleSelect}>
      <div className={classes.icon}>
        <AddIcon fontSize="inherit" />
      </div>
      <div className={selectedStyle}>
        <Typography variant="s4sHeader">{collection.title}</Typography>
      </div>
    </div>
  )
} 

const CollectionsList = ({collections, selected, setSelected}) => {
  const classes = useStyles()

  return(
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="s4sHeader">Collections</Typography>
      </div>
      <div className={classes.body}>
        <div className={classes.newCollectionField}>
          <TextField 
            placeholder="New Topic"
            size="small"
          />
        </div>
        {collections.map((collection, i) => (
          <CollectionTitle 
            key={i} 
            collection={collection} 
            selected={selected}
            handleSelect={() => setSelected(collection)}
          />
        ))}
      </div>
    </div>
  )
}

export default CollectionsList