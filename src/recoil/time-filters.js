import { atom, selector } from 'recoil';
import { computeFilterParams } from '../utils/api';
import { resourcesState } from './index';

// Computed once, and derived automatically from resourcesState, after API request:
export const timelineRangeParamsState = selector({
  key: 'timelineRangeParamsState',
  get: ({ get }) => {
    const { legacy } = get(resourcesState);

    if (legacy) {
      return computeFilterParams(legacy);
    }

    return {
      allDates: null,
      minDate: null,
      startDate: null,
      maxDate: null,
      endDate: null,
    };
  },
});

const timeFilters = atom({
  key: 'timeFilters',
  default: {
    dateRangeStart: null,
    dateRangeEnd: null,
  },
});

export const timeFiltersState = selector({
  key: 'timeFiltersState',
  get: ({ get }) => {
    const previousValues = get(timeFilters);
    if (!previousValues.dateRangeStart) {
      const { minDate, maxDate } = get(timelineRangeParamsState);
      if (minDate && maxDate) {
        return {
          dateRangeStart: minDate.substring(0, 10),
          dateRangeEnd: maxDate.substring(0, 10),
        };
      }
    }
    return previousValues;
  },
  set: ({ get, set }, newValues) => {
    const previousValues = get(timeFilters);
    set(timeFilters, {
      ...previousValues,
      ...newValues,
    });
  },
});
