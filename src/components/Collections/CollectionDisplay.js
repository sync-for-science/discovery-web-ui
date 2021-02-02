import React, {useState} from 'react'
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '700px', 
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
  recordCardsContainer: {
    padding: '20px' 
  }
}));

const CollectionDisplay = ({selected, records, groupedRecordIds}) => {
  const classes = useStyles()
  console.log('groupedRecordIds', groupedRecordIds)

  
  let collectionData
  if ( selected ) {
    if (selected.id !== 2) {
      collectionData = <Typography variant="s4sHeader">No RecordCards in this collection</Typography>
    } else {
      collectionData = <Typography variant="s4sHeader">Show Immunization Collection RecordCards</Typography>
    }
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="s4sHeader">CollectionDisplay</Typography>
      </div>
      <div className={classes.recordCardsContainer}>
        {collectionData}
      </div>
    </div>
  )
}

export default CollectionDisplay