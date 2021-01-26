import { atom, selector } from 'recoil';
import { resourcesState } from './index';

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
