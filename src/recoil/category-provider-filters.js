import { atom, selector } from 'recoil';
import { resourcesState } from './index';

export const SELECTION_STATES = {
  NONE: 'NONE',
  SELECTED: 'SELECTED', // show only active/selected subset
  ALL: 'ALL',
};

const storedActiveCategoriesState = atom({
  key: 'storedActiveCategoriesState',
  // Object whose keys are a Category label, and values are a Boolean:
  default: {
  },
});

export const categoriesModeState = atom({
  key: 'categoriesModeState',
  default: SELECTION_STATES.SELECTED,
});

export const activeCategoriesState = selector({
  key: 'activeCategoriesState',
  get: ({ get }) => {
    const activeCategories = get(storedActiveCategoriesState);
    const categoriesMode = get(categoriesModeState);
    if (categoriesMode !== SELECTION_STATES.SELECTED || Object.entries(activeCategories).length === 0) {
      const { categories } = get(resourcesState);
      return categories.reduce((acc, cat) => ({
        ...acc,
        [cat]: (categoriesMode !== SELECTION_STATES.NONE),
      }), {});
    }
    return activeCategories;
  },
  set: ({ get, set }, newValue) => {
    // could this lead to a cycle?
    set(storedActiveCategoriesState, newValue);
    set(categoriesModeState, SELECTION_STATES.SELECTED);
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
  default: SELECTION_STATES.SELECTED,
});

export const activeProvidersState = selector({
  key: 'activeProvidersState',
  get: ({ get }) => {
    const activeProviders = get(storedActiveProvidersState);
    const providersMode = get(providersModeState);
    if (providersMode !== SELECTION_STATES.SELECTED || Object.entries(activeProviders).length === 0) {
      const { providers } = get(resourcesState);
      return providers.reduce((acc, prov) => ({
        ...acc,
        [prov]: (providersMode !== SELECTION_STATES.NONE),
      }), {});
    }
    return activeProviders;
  },
  set: ({ get, set }, newValue) => {
    set(storedActiveProvidersState, newValue);
    // could this lead to a cycle?
    set(providersModeState, SELECTION_STATES.SELECTED);
  },
});
