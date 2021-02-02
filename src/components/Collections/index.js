import React from 'react';

import { useRecoilValue } from 'recoil';
import { allRecordIds, resourcesState, patientRecord } from '../../recoil';

const Collections = () => {
  const recordIds = useRecoilValue(allRecordIds);
  const resources = useRecoilValue(resourcesState);
  const patient = useRecoilValue(patientRecord);

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
        <h4>patient:</h4>
        <pre>
          { JSON.stringify(patient, null, '  ') }
        </pre>
        <h4>records:</h4>
        <pre>
          { JSON.stringify(records, null, '  ') }
        </pre>
        <h4>recordIds:</h4>
        <pre>
          { JSON.stringify(recordIds, null, '  ') }
        </pre>
      </div>
    </div>
  );
};

export default React.memo(Collections);
