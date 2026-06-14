import { getAccessToken, setAccessToken, removeAccessToken } from './token.js';

export const parseJsonSafe = async response => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return null;
    }
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
};

const getServerUrl = () => {
    const configUrl =
        typeof window !== 'undefined' &&
        window.__APP_CONFIG__ &&
        window.__APP_CONFIG__.API_BASE_URL
            ? String(window.__APP_CONFIG__.API_BASE_URL).trim()
            : '';

    if (configUrl) {
        return configUrl.replace(/\/+$/, '');
    }

    const host = window.location.hostname;
    return host.includes('localhost')
        ? 'http://localhost:8080'
        : `http://${host}:8080`;
};

const refreshAccessToken = async () => {
    try {
        const response = await fetch(`${getServerUrl()}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });
        const body = await parseJsonSafe(response);
        if (!response.ok) {
            removeAccessToken();
            return null;
        }

        const token =
            body && (body.accessToken || (body.data && body.data.accessToken));
        if (token) {
            const normalized = String(token).replace(/\s+/g, '');
            setAccessToken(normalized);
            return normalized;
        }
    } catch (error) {
        console.error('refreshAccessToken error', error);
    }
    removeAccessToken();
    return null;
};

export const requestJson = async (url, options = {}) => {
    const requestOptions = {
        credentials: 'include',
        ...options,
    };

    const token = getAccessToken();
    if (token) {
        requestOptions.headers = requestOptions.headers || {};
        if (
            !requestOptions.headers.Authorization &&
            !requestOptions.headers.authorization
        ) {
            requestOptions.headers.Authorization = `Bearer ${token}`;
        }
    }

    const doFetch = async opts => {
        const { _retry, ...fetchOpts } = opts;
        try {
            const response = await fetch(url, fetchOpts);
            const body = await parseJsonSafe(response);
            return {
                response,
                ok: response.ok,
                status: response.status,
                code: body && (body.code || body.message)
                    ? body.code || body.message
                    : null,
                data: body && Object.prototype.hasOwnProperty.call(body, 'data')
                    ? body.data
                    : null,
                body,
            };
        } catch (error) {
            return {
                response: null,
                ok: false,
                status: 0,
                code: null,
                data: null,
                body: null,
                error,
            };
        }
    };

    let result = await doFetch(requestOptions);

    if (
        result.status === 401 &&
        !requestOptions._retry &&
        !url.endsWith('/auth/refresh') &&
        !url.endsWith('/auth')
    ) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            const retryOptions = {
                ...requestOptions,
                _retry: true,
            };
            retryOptions.headers = retryOptions.headers || {};
            retryOptions.headers.Authorization = `Bearer ${refreshed}`;
            result = await doFetch(retryOptions);
        }
    }

    return result;
};
