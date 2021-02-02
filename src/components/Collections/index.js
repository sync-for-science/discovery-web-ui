import React, {useState} from 'react';
import Grid from '@material-ui/core/Grid';
import { useRecoilValue } from 'recoil';

import {
  allRecordIds, groupedRecordIdsState, resourcesState, patientRecord,
} from '../../recoil';
import CollectionsList from './CollectionsList'
import CollectionDisplay from './CollectionDisplay'

const renderRecordJSON = ({loading, categories, groupedRecordIds, patient, records, recordIds}) => {
  return (
    <>
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
          <h4>recordIds:</h4>
          <pre>
            { JSON.stringify(recordIds, null, '  ') }
          </pre>
        </div>
      </div>
    </>
  )
}

/* eslint-disable react/jsx-one-expression-per-line */
const Collections = () => {
  const recordIds = useRecoilValue(allRecordIds);
  const groupedRecordIds = useRecoilValue(groupedRecordIdsState);
  const resources = useRecoilValue(resourcesState);
  const patient = useRecoilValue(patientRecord);

  const dummyCollections = [
    {
      id: 0,
      title: 'Diabetes',
    },
    {
      id: 1,
      title: 'High Blood Pressure',
    },
    {
      id: 2,
      title: 'Immunizations',
      recordCardIds: {},
    },
    {
      id: 3,
      title: 'Sprains',
    }
  ]

  // setState for dummyCollections to give appearance of multiple collections
  const [collections, setCollections] = useState(dummyCollections)
  const [selected, setSelected] = useState(null)

  const {
    loading, records, categories, providers,
  } = resources;


  

  return (
    <>
      {/* {renderRecordJSON({loading, categories, groupedRecordIds, patient, records, recordIds})} */}
      <Grid container spacing={2}>
        <Grid style={{paddingLeft: '0px'}} item xs={3}>
          <CollectionsList 
            collections={collections} 
            selected={selected} 
            setSelected={setSelected}
          />
        </Grid>
        <Grid item xs={9}>
          <CollectionDisplay 
            selected={selected}
            records={records}
            groupedRecordIds={groupedRecordIds}
          />
        </Grid>
      </Grid>
    </>
  )
}

export default React.memo(Collections);
