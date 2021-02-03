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
  const groupedRecordIds = useRecoilValue(groupedRecordIdsState);
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
        {categories.map((catLabel) => activeCategories[catLabel] && (
          <Accordion
            key={catLabel}
            // defaultExpanded={activeCategories[catLabel]}
            disabled={!activeCategories[catLabel]}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
            >
              <Typography>{catLabel}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {
                activeCategories[catLabel] && groupedRecordIds[catLabel] && groupedRecordIds[catLabel].map((uuid) => (
                  <RecordCard
                    key={`record-card-${uuid}`}
                    recordId={uuid}
                    records={records}
                  />
                ))
              }
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </PersistentDrawerRight>
  );
};

export default React.memo(SelectedCardCollection);
