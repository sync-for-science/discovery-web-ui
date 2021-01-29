import React from 'react';
import {
  atom, selector, useRecoilValue,
} from 'recoil';

export * from './category-provider-filters';

export const resourcesState = atom({
  key: 'resourcesState', // unique ID (with respect to other atoms/selectors)
  default: {
    loading: false,
    error: null,
    raw: null,
    normalized: null,
    records: {},
    totalResCount: 0,
    patient: null,
    providers: [],
    categories: [],
    legacy: null,
  },
  // dangerouslyAllowMutability: true, // < Object.isExtensible(res.data), in: src/components/Annotation/index.js
});

export const filtersState = atom({
  key: 'filtersState',
  default: {
    dates: null,
    thumbLeftDate: null,
    thumbRightDate: null,
  },
});

export const allRecordIds = selector({
  key: 'allRecordIds',
  get: ({ get }) => {
    const { records } = get(resourcesState);
    // Return all record ids as an Array:
    return Object.entries(records).reduce((acc, [uuid, record]) => {
      if (record.category === 'Patient') {
        console.info(`IGNORE PATIENT ${uuid}`); // eslint-disable-line no-console
      }
      acc.push(uuid);
      return acc;
    }, []);
  },
});

// TODO: ^other states facilitate implementation of something like the following:
// export const collectionsState = atom({
//   key: 'collectionsState',
//   default: {
//     activeCollection: 'default',
//     collections: {
//       default: {},
//     },
//   },
// });

// read-only connection to resources and filters:
export const connectToResources = (Component) => (props) => {
  const resources = useRecoilValue(resourcesState);
  const filters = useRecoilValue(filtersState);
  // useContext(DiscoveryContext);

  return (
    <Component
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      resources={resources}
      filters={filters}
    />
  );
};
