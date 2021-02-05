import React from 'react';
import { useRecoilValue } from 'recoil';
import AppBar from '@material-ui/core/AppBar';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { makeStyles } from '@material-ui/core/styles';
import {
  activeCategoriesState, resourcesState, allRecordIds, groupedRecordIdsInCurrentCollectionState,
} from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';
import RecordCard from '../cards/RecordCard';

const useStyles = makeStyles(() => ({
  appBar: {
    minWidth: 'initial',
  },
}));

const CardListHeader = ({ collectionCount, totalCount }) => {
  const classes = useStyles();
  return (
    <AppBar
      position="relative"
      className={classes.appBar}
    >
      <Typography variant="card-list-header">
        Displaying {collectionCount} of {totalCount} records {/* eslint-disable-line react/jsx-one-expression-per-line */}
      </Typography>
    </AppBar>
  );
};

const SelectedCardCollection = () => {
  const recordIds = useRecoilValue(allRecordIds);
  const groupedRecordIdsBySubtype = useRecoilValue(groupedRecordIdsInCurrentCollectionState);
  const resources = useRecoilValue(resourcesState);
  const activeCategories = useRecoilValue(activeCategoriesState);

  const {
    records, categories, // loading, providers,
  } = resources;

  // const recordCount = Object.values(groupedRecordIds).reduce((acc, arr) => (acc + arr.length), 0);

  return (
    <PersistentDrawerRight>
      <CardListHeader
        collectionCount={recordIds.length}
        totalCount={recordIds.length}
      />
      <div className="card-list">
        {categories.filter((catLabel) => activeCategories[catLabel]).map((catLabel) => Object.entries(groupedRecordIdsBySubtype[catLabel])
          .sort(([subtype1], [subtype2]) => ((subtype1 < subtype2) ? -1 : 1))
          .map(([displayCoding, uuids]) => (
            <Accordion
              key={displayCoding}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
              >
                <Typography>
                  {catLabel}
                  {' - '}
                  {displayCoding}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {
                  uuids.map((uuid) => (
                    <RecordCard
                      key={`record-card-${uuid}`}
                      recordId={uuid}
                      records={records}
                    />
                  ))
                }
              </AccordionDetails>
            </Accordion>
          )))}
      </div>
    </PersistentDrawerRight>
  );
};

export default React.memo(SelectedCardCollection);
