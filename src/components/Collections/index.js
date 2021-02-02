import React from 'react';

import { useRecoilValue } from 'recoil';
import {
  allRecordIds, groupedRecordIdsState, resourcesState, patientRecord,
} from '../../recoil';

/* eslint-disable react/jsx-one-expression-per-line */
const Collections = () => {
  const recordIds = useRecoilValue(allRecordIds);
  const groupedRecordIds = useRecoilValue(groupedRecordIdsState);
  const resources = useRecoilValue(resourcesState);
  const patient = useRecoilValue(patientRecord);

  const {
    loading, records, categories, providers,
  } = resources;

  return (
    <div>
      <h3>COLLECTIONS</h3>
      <div>
        loading:
        { String(loading) }
      </div>
      <div className="collections-content">
        {categories.map((catLabel) => (
          <div key={catLabel}>
            <h4>{catLabel}</h4>
            <div>
              {groupedRecordIds[catLabel]?.map((uuid) => {
                const record = records[uuid];
                const { category, data: { resourceType, contained: { resourceType: containedResourceType } = {} } } = record;
                return (
                  <div key={uuid}>
                    <hr />
                    <pre><b>uuid</b>: {uuid}</pre>
                    <pre><b>category</b>: {category}</pre>
                    <pre><b>resourceType</b>: {resourceType}</pre>
                    <pre><b>containedResourceType</b>: {JSON.stringify(containedResourceType)}</pre>
                    <pre>
                      <b>Contained</b>: { JSON.stringify(record.data?.contained, null, '  ') }
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <hr />
        <div>
          <h4>groupedRecordIds:</h4>
          <pre>
            { JSON.stringify(groupedRecordIds, null, '  ') }
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
