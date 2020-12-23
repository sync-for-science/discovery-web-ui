import { get as fetch } from 'axios';
import {
  atom, selectorFamily, useRecoilState, useRecoilValue,
} from 'recoil';
// https://recoiljs.org/docs/guides/asynchronous-data-queries/

export const participantRecordsState = atom({
  key: 'resourcesState', // unique ID (with respect to other atoms/selectors)
  default: {
    loading: false,
    data: null,
  }, // default value (aka initial value)
});

export const participantRecordsQuery = selectorFamily({
  key: 'participantRecordsQuery',
  get: (dataUrl) => async ({ get }) => {
    // get(userInfoQueryRequestIDState(userID)); // Add request ID as a dependency
    const response = await fetch(dataUrl);
    console.error('response: ', response);
    if (response.error) {
      throw response.error;
    }
    return response;
  },
});

/*
  // const dotClickContext = useRecoilValue(resourcesState);
  const [resources, setResources] = useRecoilState(resourcesState);

  useEffect(() => {
    async function fetchData() {
      const { match: { params: { id, participantId } } } = props;

      // Check for uploaded data
      const dataUrl = id ? `${config.serverUrl}/data/download/${id}`
        : `${config.serverUrl}/participants/${participantId}`;

      console.error('>>>>>>>>>>>>> dataUrl: ', dataUrl);

      // axios.get:
      const response = await get(dataUrl);
      console.error('>>>>>>>>>>>>> response: ', response);
      setResources(response.data);
    }
    fetchData();
  }, []); // empty array for dependency: invoke only when mounted.
 */
