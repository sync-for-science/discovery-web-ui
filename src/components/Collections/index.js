import React from 'react';

import { useRecoilValue } from 'recoil';
import { allRecordIds, connectToResources } from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';
import RecordCard from '../cards/RecordCard';

const CardList = ({
  recordIds, records, normalized, patient,
}) => {
  if (!normalized) {
    return null;
  }

  // const record = normalized.filter((element) => element.category === 'Lab Results');
  // const record = normalized.filter(element => element.data.id === '4afef915-ade7-42d4-8e82-5012e1c47704')
  // return record.map((r, i) => <RecordCard key={i} resource={r} normalized={normalized} />);

  return recordIds.map((uuid) => (
    <RecordCard
      key={`record-card-${uuid}`}
      resource={records[uuid]}
      records={normalized}
      patient={patient}
    />
  ));
};

const Collections = (props) => {
  const recordIds = useRecoilValue(allRecordIds);
  // console.info('recordIds: ', recordIds);

  const {
    loading, records, normalized, patient,
  } = props.resources;

  return (
    <div>
      <h3>COLLECTIONS</h3>
      <div>
        loading:
        { String(loading) }
      </div>
      <div className="collections-content">
        <pre>
          { JSON.stringify(normalized, null, '  ') }
        </pre>
      </div>
      <PersistentDrawerRight>
        <div className="card-list">
          <CardList
            normalized={normalized}
            recordIds={allRecordIds}
            records={records}
            patient={patient}
          />
        </div>
      </PersistentDrawerRight>
    </div>
  );
};

export default connectToResources(Collections);
