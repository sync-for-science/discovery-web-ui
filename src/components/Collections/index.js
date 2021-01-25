import React from 'react';

import { connectToResources } from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';
import RecordCard from '../cards/RecordCard'
import jsonQuery from 'json-query'

const CardList = ({ normalized }) => {
  if (!normalized) {
    return null;
  }
  
  const options = {}
  const path = '[*category=Vital Signs]'
  const vitalSigns = jsonQuery(path, { data: normalized, ...options }).value;
  
  const record = normalized.filter(element => element.category === 'Vital Signs')
  // const record = normalized.filter(element => element.data.id === '4afef915-ade7-42d4-8e82-5012e1c47704')
  return record.map((r, i) => <RecordCard key={i} resource={r} vitalSigns={vitalSigns}/>);
  // console.log('vitalSigns: ', vitalSigns)
  // return normalized.map((r, i) => <RecordCard key={i} resource={r} vitalSigns={vitalSigns}/>);
};

const Collections = (props) => {
  const { loading, normalized, legacy } = props.resources;

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
            legacy={legacy}
          />
        </div>
      </PersistentDrawerRight>
    </div>
  );
};

export default connectToResources(Collections);
