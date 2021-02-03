import {
  atom, selector,
} from 'recoil';
import jsonQuery from 'json-query';

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
    thumbLeftDate: null,
    thumbRightDate: null,
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

export const groupedRecordIdsState = selector({
  key: 'groupedRecordIdsState',
  get: ({ get }) => {
    const { records } = get(resourcesState);
    return Object.entries(records).reduce((acc, [uuid, record]) => {
      if (record.category === 'Patient') {
        console.info(`IGNORE PATIENT ${uuid}`); // eslint-disable-line no-console
        // return acc;
      }
      const { category, data: { resourceType, contained: { resourceType: containedResourceType } = {} } } = record;
      const cat = category; // `${resourceType}:${category}`;
      acc[cat] = acc[cat] ?? [];
      acc[cat].push(uuid);
      return acc;
    }, {});
  },
});

export const patientRecord = selector({
  key: 'patientRecord',
  get: ({ get }) => {
    const { records } = get(resourcesState);
    return Object.values(records).find(({ category }) => category === 'Patient');
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

// TODO: ^other states facilitate implementation of something like the following:
export const collectionsState = atom({
  key: 'collectionsState',
  default: {
    activeCollection: 'default',
    collections: {
      default: {},
    },
  },
});

// TODO: use 3rd party library, eg, reselect:
const recoilAtomsCache = {};
const memoize = (f) => (...args) => {
  const cacheKey = args.join('-');
  recoilAtomsCache[cacheKey] = recoilAtomsCache[cacheKey] ?? f(...args);
  return recoilAtomsCache[cacheKey];
};

const pruneEmpty = ((o) => Object.entries(o).reduce((acc, [k, v]) => {
  // prune items whose values are null, undefined, or empty string:
  if (v) {
    acc[k] = v;
  }
  return acc;
}, {}));

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


