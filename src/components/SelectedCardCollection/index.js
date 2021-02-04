import React from 'react';
import { useRecoilValue } from 'recoil';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import {
  activeCategoriesState, resourcesState, groupedRecordIdsState, allRecordIds,
} from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';
import RecordCard from '../cards/RecordCard';

const SelectedCardCollection = () => {
  const recordIds = useRecoilValue(allRecordIds);
  const groupedRecordIdsBySubtype = useRecoilValue(groupedRecordIdsBySubtypeState);
  const resources = useRecoilValue(resourcesState);
  const activeCategories = useRecoilValue(activeCategoriesState);

  const {
    records, categories, // loading, providers,
  } = resources;

  // const recordCount = Object.values(groupedRecordIds).reduce((acc, arr) => (acc + arr.length), 0);

  return (
    <PersistentDrawerRight>
      {/* <h4>Displaying {recordCount} of {recordIds.length} records</h4> */}
      <h4>
        Displaying X of
        {' '}
        {recordIds.length}
        {' '}
        records
      </h4>
      <div className="card-list">
        {categories.filter((catLabel) => activeCategories[catLabel]).map((catLabel) => Object.entries(groupedRecordIdsBySubtype[catLabel])
          .sort(([subtype1], [subtype2]) => ((subtype1 < subtype2) ? -1 : 1))
          .map(([displayCoding, uuids]) => (
            <Accordion
              key={displayCoding}
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
