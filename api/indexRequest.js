import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const getPosts = cursor => {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    const result = requestJson(`${getServerUrl()}/posts${query}`);
    return result;
};
