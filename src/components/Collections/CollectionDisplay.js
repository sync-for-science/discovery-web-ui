import React from 'react'
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useRecoilValue } from 'recoil'

import { activeCategoriesState } from '../../recoil/index'
import RecordCard from '../cards/RecordCard'
import CollectionsNoteEditor from '../notes/CollectionsNoteEditor'


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
    padding: '5px'
  },
  bodyContainer: {
    padding: '20px',
    height: 'calc( 100% - 70px )'
  },
  recordCardsContainer: {
    height: '70%',
    overflow: 'hidden',
    borderBottom: '1px solid lightgray'
  },
  collectionNotes: {
    height: "calc(30% - 25px)",
    marginTop: '20px',
    overflowY: 'scroll'
  }
}));

const CollectionDisplay = ({selected, records, groupedRecordIds, patient}) => {
  const activeCategories = useRecoilValue(activeCategoriesState);
  const classes = useStyles()
  const collectionName = selected ? selected.title : "Untitled Collection"

  const displayRecordCards = (groupedRecordIds, records, activeCategories) => {
    return Object.entries(groupedRecordIds).map(([category, recordIds]) => {
      if (category === "Patient") {
        return null
      }
      if (activeCategories[category]) {
        return(
          <div key={`groupedRecordCard-${category}`} style={{margin: '5px'}}>
            <div style={{width: '400px'}}>
              <Typography variant="s4sHeader">{category}</Typography>
            </div>
            <div style={{ height: '95%', overflowY: 'scroll', paddingRight: '10px'}}>
              {recordIds.map((recordId, i) => {
                return(
                  <RecordCard key={i} recordId={recordId} records={records} patient={patient} />
                )
              })}
            </div>
          </div>
        )
      }
      return null
    })
  }
  
  console.log('selected', selected)
  let collectionData
  if ( selected ) {
    if (selected.id !== 2) {
      collectionData = <Typography variant="s4sHeader">No RecordCards in this collection</Typography>
    } else {
      collectionData = (
        <div style={{display: 'flex', overflowX: 'scroll', height: '100%' }}>
          {displayRecordCards(groupedRecordIds, records, activeCategories)}
        </div>
      )
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
  )
}

export default CollectionDisplay