import { useReducer, useEffect } from "react";
import axios from "axios";

const BASE_URL = "https://mysterious-castle-93180.herokuapp.com/https://jobs.github.com/positions.json";
const ACTION = {
  MAKE_REQUEST: "make-request",
  GET_DATA: "get-data",
  ERROR: "error",
  UPDATE_HAS_NEXT_PAGE: 'update-has-next-page' // since the api is paginated, need to check if there is a next
  // page available to render the pagination buttons
};
function reducer(state, action) {
  switch (action.type) {
    case ACTION.MAKE_REQUEST:
      return { loading: true, jobs: [] };
    case ACTION.GET_DATA:
      return { ...state, loading: false, jobs: action.payload.jobs };
    case ACTION.ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        jobs: [],
      };
    case ACTION.UPDATE_HAS_NEXT_PAGE:
        return { ...state, hasNextPage: action.payload.hasNextPage }
    default:
      return state;
  }
}

export const useFetchJobs = (params, page) => {
  const [state, dispatch] = useReducer(reducer, { jobs: [], loading: true });

  useEffect(() => {
    // cancels previous call if the calls you're making are too fast
    const cancelToken = axios.CancelToken.source();
    const cancelToken2 = axios.CancelToken.source();
    dispatch({ type: ACTION.MAKE_REQUEST });
    axios
      .get(BASE_URL, {
        cancelToken: cancelToken.token, // get token
        params: {
          markdown: true,
          page: page,
          ...params,
        },
      })
      .then((res) => {
        dispatch({ type: ACTION.GET_DATA, payload: { jobs: res.data } });
      })
      .catch((e) => {
        // add a check here for the cancel token. If purposefully cancelled, then it's not a real error
        if(axios.isCancel(e)){
          return; // don't really need to do anything
        }
        dispatch({ type: ACTION.ERROR, payload: { error: e } });
      });

      // Another call to check if next page has data
      axios
      .get(BASE_URL, {
        cancelToken: cancelToken2.token, // get token
        params: {
          markdown: true,
          page: page + 1, // next page
          ...params,
        },
      })
      .then((res) => {
        dispatch({ type: ACTION.UPDATE_HAS_NEXT_PAGE, payload: { hasNextPage: res.data.length !== 0 } });
      })
      .catch((e) => {
        // add a check here for the cancel token. If purposefully cancelled, then it's not a real error
        if(axios.isCancel(e)){
          return; // don't really need to do anything
        }
        dispatch({ type: ACTION.ERROR, payload: { error: e } });
      });
      // if you do a return here, it will run this function any time the params, page are changed
      return () => {
        cancelToken.cancel();
        cancelToken2.cancel();
        // when this token is called, it will call the .catch
      }
  }, [params, page]);
  return state;
};

export default useFetchJobs;
