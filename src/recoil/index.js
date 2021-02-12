import {
  atom, selector,
} from 'recoil';
import jsonQuery from 'json-query';
import { activeCategoriesState, activeProvidersState } from './category-provider-filters';

export * from './category-provider-filters';

export const resourcesState = atom({
  key: 'resourcesState', // unique ID (with respect to other atoms/selectors)
  default: {
    loading: false,
    error: null,
    raw: null,
    records: {},
    totalResCount: 0,
    providers: [],
    categories: [],
    legacy: null,
  },
  // dangerouslyAllowMutability: true, // < Object.isExtensible(res.data), in: src/components/Annotation/index.js
});

const timeFilters = atom({
  key: 'timeFilters',
  default: {
    dates: null,
    // dates: {
    //   allDates: null,
    //   minDate: null,
    //   startDate: null,
    //   maxDate: null,
    //   endDate: null,
    // },
    dateRangeStart: null,
    dateRangeEnd: null,
  },
});

export const timeFiltersState = selector({
  key: 'timeFiltersState',
  get: ({ get }) => get(timeFilters),
  set: ({ get, set }, newValues) => {
    const previousValues = get(timeFilters);
    set(timeFilters, {
      ...previousValues,
      ...newValues,
    });
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
        return acc;
      }
      acc.push(uuid);
      return acc;
    }, []);
  },
});

// from src/components/Unimplemented/index.js :
const UNIMPLEMENTED_CATEGORIES = [
  'Practitioner', 'List', 'Questionnaire', 'Questionnaire Response', 'Observation-Other',
  'Diagnostic Report', 'Care Plan', 'Medication', 'Organization', 'Goal', 'Basic',
  'Immunization Recommendation', 'Imaging Study', 'Coverage', 'Related Person', 'Device',
];

export const groupedRecordIdsBySubtypeState = selector({
  key: 'groupedRecordIdsBySubtypeState',
  get: ({ get }) => {
    const { records } = get(resourcesState);
    const allCategories = Object.entries(records).reduce((acc, [uuid, record]) => {
      if (record.category === 'Patient') {
        console.info(`IGNORE PATIENT ${uuid}`); // eslint-disable-line no-console
        // return acc;
      }
      // const { category, displayCoding, data: { resourceType, contained: { resourceType: containedResourceType } = {} } } = record;
      const { category, displayCoding } = record;
      const cat = UNIMPLEMENTED_CATEGORIES.includes(category) ? 'Other' : category; // `${resourceType}:${category}`;
      acc[cat] = acc[cat] ?? { totalCount: 0, subtypes: {} };
      const subType = displayCoding.display ?? '(no subtype)'; // Safety, but may be unnecessary
      acc[cat].subtypes[subType] = acc[cat].subtypes[subType] ?? [];
      acc[cat].subtypes[subType].push(uuid);
      acc[cat].totalCount += 1;
      return acc;
    }, {});
    // console.info('groupedRecordIdsBySubtypeState: ', JSON.stringify(result, null, '  '));
    return allCategories;
  },
});

export const patientRecord = selector({
  key: 'patientRecord',
  get: ({ get }) => {
    const { records } = get(resourcesState);
    // TODO: after patient exists, memoize patient, possibly using reselect?
    // always return an Object:
    return Object.values(records).find(({ category }) => category === 'Patient') || {};
  },
});

export const labResultRecords = selector({
  key: 'labResultRecords',
  get: ({ get }) => {
    const { records } = get(resourcesState);
    return jsonQuery('[*category=Lab Results]', { data: Object.values(records) }).value;
  },
});

export const vitalSignsRecords = selector({
  key: 'vitalSignsRecords',
  get: ({ get }) => {
    const { records } = get(resourcesState);
    return jsonQuery('[*category=Vital Signs]', { data: Object.values(records) }).value;
  },
});

const pruneEmpty = ((o) => Object.entries(o).reduce((acc, [k, v]) => {
  // prune items whose values are null, undefined, or empty string:
  if (v) {
    acc[k] = v;
  }
  return acc;
}, {}));

// TODO: ^other states facilitate implementation of something like the following:
export const allCollectionsState = atom({
  key: 'allCollectionsState',
  default: {
    activeCollectionId: 'default',
    collections: {
      default: {
        label: 'Untitled Collection',
        uuids: {},
        recentlyAddedUuids: {},
      },
    },
  },
});

export const activeCollectionState = selector({
  key: 'activeCollectionState',
  get: ({ get }) => {
    const allCollections = get(allCollectionsState);
    const { activeCollectionId, collections } = allCollections;
    const currentActiveCollection = collections[activeCollectionId];
    return currentActiveCollection;
  },
  set: ({ get, set }, newValues) => {
    // newValues is a hash where each key is a record uuid, whose value is a Boolean (to add or remove)
    const allCollections = get(allCollectionsState);
    const { activeCollectionId, collections } = allCollections;
    const currentActiveCollection = collections[activeCollectionId];
    const { label } = currentActiveCollection;
    const uuids = pruneEmpty({
      ...currentActiveCollection.uuids,
      ...newValues,
    });
    set(allCollectionsState, {
      activeCollectionId,
      collections: {
        ...allCollections.collections,
        [activeCollectionId]: {
          label,
          uuids,
          recentlyAddedUuids: pruneEmpty(newValues),
        },
      },
    });
  },
});

// derived from util.js inDateRange, but simplified: TODO: use date-fns and tz-aware Date math?
const isInDateRange = (date, dateRangeStart, dateRangeEnd) => {
  const dateStr = date.substring(0, 10);
  return dateStr >= dateRangeStart && dateStr <= dateRangeEnd;
};

// shape has diverged from groupedRecordIdsBySubtypeState:
export const filteredActiveCollectionState = selector({
  key: 'filteredActiveCollectionState',
  get: ({ get }) => {
    const groupedRecordIdsBySubtype = get(groupedRecordIdsBySubtypeState);
    const activeCollection = get(activeCollectionState);
    const activeCategories = get(activeCategoriesState);
    const activeProviders = get(activeProvidersState);
    const { dateRangeStart, dateRangeEnd } = get(timeFiltersState);
    const { records } = get(resourcesState);
    let totalFilteredRecordCount = 0; // total count of all uuids in all categories, after applying category, provider, and timeline filters
    let totalFilteredCollectionCount = 0; // count of uuids in ^totalFilteredRecordCount, that are also in the current collection
    const { uuids: uuidsInCollection, recentlyAddedUuids } = activeCollection;
    const filteredCategories = Object.entries(groupedRecordIdsBySubtype)
      .filter(([catLabel]) => (activeCategories[catLabel]))
      .reduce((accCats, [catLabel, category]) => {
        accCats[catLabel] = Object.entries(category.subtypes).reduce((accCategory, [subtypeLabel, uuids]) => {
          const uuidsFiltered = uuids.filter((uuid) => {
            const record = records[uuid];
            return activeProviders[record.provider] && isInDateRange(record.itemDate, dateRangeStart, dateRangeEnd);
          });
          const activeUuids = uuidsFiltered.filter((uuid) => uuidsInCollection[uuid]);
          const hasLastAdded = activeUuids.reduce((acc, uuid) => recentlyAddedUuids[uuid] || acc, false);
          accCategory.filteredRecordCount += uuidsFiltered.length;
          accCategory.filteredCollectionCount += activeUuids.length;
          accCategory.subtypes[subtypeLabel] = {
            hasLastAdded,
            uuids: uuidsFiltered, // not all subtype uuids -- just uuids for subtype, filtered by category, provider, and timeline filters
            collectionUuids: activeUuids, // all uuids in ^uuidsFiltered, that are also in the current collection
          };
          totalFilteredRecordCount += uuidsFiltered.length;
          totalFilteredCollectionCount += activeUuids.length;
          return accCategory;
        }, {
          filteredRecordCount: 0, // count of all uuids in category, after applying category, provider, and timeline filters
          filteredCollectionCount: 0, // count of uuids in ^filteredRecordCount, that are also in the current collection
          totalCount: category.totalCount,
          subtypes: {},
        });
        return accCats;
      }, {});
    filteredCategories.filteredRecordCount = totalFilteredRecordCount;
    filteredCategories.filteredCollectionCount = totalFilteredCollectionCount;
    // console.info('groupedRecordIdsInCurrentCollectionState: ', JSON.stringify(filteredResults, null, '  '));
    return filteredCategories;
  },
});

// TODO: use 3rd party library, eg, reselect:
const recoilAtomsCache = {};
const memoize = (f) => (...args) => {
  const cacheKey = args.join('-');
  recoilAtomsCache[cacheKey] = recoilAtomsCache[cacheKey] ?? f(...args);
  return recoilAtomsCache[cacheKey];
};

export const notesWithRecordId = memoize((recordId) => {
  const atomForThisRecord = atom({
    key: `stored-notes-${recordId}`,
    default: {},
  });
  return selector({
    key: `notesForRecord-${recordId}`, // unique ID (with respect to other atoms/selectors)
    get: ({ get }) =>
      // TODO: get from server or localStorage:
      get(atomForThisRecord),
    set: ({ get, set }, { noteId: oldId, noteText }) => {
      const existingNotesForId = get(atomForThisRecord);
      const nowUTC = (new Date()).toISOString();
      const noteId = oldId ?? nowUTC;
      set(atomForThisRecord, pruneEmpty({
        ...existingNotesForId,
        [noteId]: noteText === null ? null : { noteText, lastUpdated: nowUTC },
      }));
    },
  });
});

export const collectionNotes = memoize((collectionName) => {
  const atomForThisCollectionNotes = atom({
    key: `stored-collection-notes-${collectionName}`,
    default: {},
  });
  return selector({
    key: `notesForCollection-${collectionName}`, // unique name (with respect to other atoms/selectors)
    get: ({ get }) =>
      // TODO: get from server or localStorage:
      get(atomForThisCollectionNotes),
    set: ({ get, set }, { noteId: oldId, noteText }) => {
      const existingNotesForCollection = get(atomForThisCollectionNotes);
      const nowUTC = (new Date()).toISOString();
      const noteId = oldId ?? nowUTC;
      set(atomForThisCollectionNotes, pruneEmpty({
        ...existingNotesForCollection,
        [noteId]: noteText === null ? null : { noteText, lastUpdated: nowUTC },
      }));
    },
  });
});
