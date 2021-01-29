import React from 'react';

import { useRecoilValue } from 'recoil';
import { allRecordIds, connectToResources } from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';
import RecordCard from '../cards/RecordCard';

const CardList = ({
  recordIds, records, patient,
}) => recordIds.map((uuid) => (
  <RecordCard
    key={`record-card-${uuid}`}
    recordId={uuid}
    records={records}
    patient={patient}
  />
));

const Collections = (props) => {
  const recordIds = useRecoilValue(allRecordIds);
  // console.info('recordIds: ', recordIds);

  const {
    loading, records, patient,
  } = props.resources;

  return (
    <div>
      <h3>COLLECTIONS</h3>
      <div>
        loading:
        { String(loading) }
      </div>
      <div className="collections-content">
        <h4>patient:</h4>
        <pre>
          { JSON.stringify(patient, null, '  ') }
        </pre>
        <h4>records:</h4>
        <pre>
          { JSON.stringify(records, null, '  ') }
        </pre>
      </div>
      <PersistentDrawerRight>
        <div className="card-list">
          <CardList
            recordIds={recordIds}
            records={records}
            patient={patient}
          />
        </div>
      </PersistentDrawerRight>
    </div>
  );
};

export default connectToResources(Collections);
