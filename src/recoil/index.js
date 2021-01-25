import React from 'react';
import {
  atom, selector, selectorFamily, DefaultValue, useRecoilValue,
} from 'recoil';

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
  // dangerouslyAllowMutability: true, < Object.isExtensible(res.data), in: src/components/Annotation/index.js
});

export const filtersState = atom({
  key: 'filtersState',
  default: {
    dates: null,
    thumbLeftDate: null,
    thumbRightDate: null,
  },
});

const storedActiveCategoriesState = atom({
  key: 'storedActiveCategoriesState',
  // Object whose keys are a Category label, and values are a Boolean:
  default: {
  },
});

export const categoriesModeState = atom({
  key: 'categoriesModeState',
  default: 'active',
  // 'active': show only active subset
  // 'all': show all
  // 'none': show none
});

export const activeCategoriesState = selector({
  key: 'activeCategoriesState',
  get: ({ get }) => {
    const activeCategories = get(storedActiveCategoriesState);
    const categoriesMode = get(categoriesModeState);
    if (categoriesMode !== 'active' || Object.entries(activeCategories).length === 0) {
      const { categories } = get(resourcesState);
      return categories.reduce((acc, cat) => ({
        ...acc,
        [cat]: (categoriesMode !== 'none'),
      }), {});
    }
    return activeCategories;
  },
  set: ({ get, set }, newValue) => {
    // could this lead to a cycle?
    set(storedActiveCategoriesState, newValue);
    set(categoriesModeState, 'active');
  },
});

const storedActiveProvidersState = atom({
  key: 'storedActiveProvidersState',
  // Object whose keys are a Provider label, and values are a Boolean:
  default: {
  },
});

export const providersModeState = atom({
  key: 'providersModeState',
  default: 'active',
  // 'active': show only active subset
  // 'all': show all
  // 'none': show none
});

export const activeProvidersState = selector({
  key: 'activeProvidersState',
  get: ({ get }) => {
    const activeProviders = get(storedActiveProvidersState);
    const providersMode = get(providersModeState);
    if (providersMode !== 'active' || Object.entries(activeProviders).length === 0) {
      const { providers } = get(resourcesState);
      return providers.reduce((acc, prov) => ({
        ...acc,
        [prov]: (providersMode !== 'none'),
      }), {});
    }
    return activeProviders;
  },
  set: ({ get, set }, newValue) => {
    set(storedActiveProvidersState, newValue);
    // could this lead to a cycle?
    set(providersModeState, 'active');
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
