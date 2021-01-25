import React from 'react';
import { useRecoilValue, atom } from 'recoil';

export const resourcesState = atom({
  key: 'resourcesState', // unique ID (with respect to other atoms/selectors)
  default: {
    loading: false,
    error: null,
    raw: null,
    normalized: null,
    totalResCount: 0,
    patient: null,
    providers: [],
    categories: [],
    legacy: null,
  },
});

export const filtersState = atom({
  key: 'filtersState', // unique ID (with respect to other atoms/selectors)
  default: {
    dates: null,
    thumbLeftDate: null,
    thumbRightDate: null,
  },
});

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
