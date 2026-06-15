import { getServerUrl } from '../utils/function.js';
import { requestJson } from '../utils/request.js';

export const changePassword = async newPassword => {
    const result = await requestJson(`${getServerUrl()}/users/me/password`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            newPassword,
        }),
    });
    return result;
};
