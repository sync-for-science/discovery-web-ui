import React from 'react';

import { useRecoilValue } from 'recoil';
import {
  resourcesState, patientRecord, groupedRecordIdsInCurrentCollectionState,
} from '../../recoil';

/* eslint-disable react/jsx-one-expression-per-line */
const Collections = () => {
  const resources = useRecoilValue(resourcesState);
  const patient = useRecoilValue(patientRecord);
  const groupedRecordIdsInCurrentCollection = useRecoilValue(groupedRecordIdsInCurrentCollectionState);

  const {
    loading, records,
  } = resources;

  return (
    <div>
      <h3>COLLECTIONS</h3>
      <div>
        loading:
        { String(loading) }
      </div>
      <div className="collections-content">
        <div>
          <h4>groupedRecordIdsInCurrentCollection:</h4>
          <pre>
            {JSON.stringify(groupedRecordIdsInCurrentCollection, null, '  ') }
          </pre>
        </div>
        <hr />
        <div style={{ backgroundColor: '#ff9' }}>
          <h4>patient:</h4>
          <pre>
            { JSON.stringify(patient, null, '  ') }
          </pre>
        </div>
        <hr />
        <div>
          <h4>records:</h4>
          <pre>
            { JSON.stringify(records, null, '  ') }
          </pre>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Collections);
