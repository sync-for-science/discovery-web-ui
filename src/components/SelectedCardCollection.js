import React from 'react';

import { useRecoilValue } from 'recoil';
import {
  resourcesState, allRecordIds, // groupedRecordIdsState,
} from '../recoil';
import PersistentDrawerRight from './ContentPanel/Drawer';
import RecordCard from './cards/RecordCard';

const SelectedCardCollection = () => {
  const resources = useRecoilValue(resourcesState);
  // const groupedRecordIds = useRecoilValue(groupedRecordIdsState);
  const recordIds = useRecoilValue(allRecordIds);

  const {
    records, // categories, providers,
  } = resources;

  return (
    <PersistentDrawerRight>
      <div className="card-list">
        {recordIds.map((uuid) => (
          <RecordCard
            key={`record-card-${uuid}`}
            recordId={uuid}
            records={records}
          />
        ))}
      </div>
    </PersistentDrawerRight>
  );
};

export default React.memo(SelectedCardCollection);
