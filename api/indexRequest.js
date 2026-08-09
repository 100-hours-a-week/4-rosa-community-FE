import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const getPosts = (cursor, categoryCode = null) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (categoryCode) params.set('categoryCode', categoryCode);

    const query = params.toString() ? `?${params.toString()}` : '';
    const result = requestJson(`${getServerUrl()}/posts${query}`);
    return result;
};
