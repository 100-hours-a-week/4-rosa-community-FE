import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const deleteComment = commentId => {
    const result = requestJson(`${getServerUrl()}/comments/${commentId}`, {
        method: 'DELETE',
    });
    return result;
};

export const updateComment = (commentId, content) => {
    const result = requestJson(`${getServerUrl()}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    });
    return result;
};
