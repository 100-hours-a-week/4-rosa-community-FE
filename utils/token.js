let _accessToken = null;

export const getAccessToken = () => {
    return _accessToken;
};

export const setAccessToken = token => {
    _accessToken = token || null;
};

export const removeAccessToken = () => {
    _accessToken = null;
};

export const clearAuthStorage = () => {
    _accessToken = null;

    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('email');
            window.localStorage.removeItem('nickname');
            window.localStorage.removeItem('profileImageUrl');
            window.localStorage.removeItem('userId');
        }
        if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.removeItem('accessToken');
        }
    } catch (error) {
        return;
    }
};
