import { API_URL } from './config';


// Helper for Fetch
const apiRequest = async (endpoint, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token') || ''
    };

    const headers = { ...defaultHeaders, ...options.headers };

    if (options.removeContentType) {
        delete headers['Content-Type'];
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        headers,
        ...options
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'API Request failed');
    return data;
};

/* --- MESSAGES --- */
export const addMessage = async (messageData) => {
    // messageData can be FormData if it contains a file
    const isFormData = messageData instanceof FormData;

    const options = {
        method: 'POST',
        body: isFormData ? messageData : JSON.stringify(messageData)
    };

    if (isFormData) {
        options.removeContentType = true;
    }

    return apiRequest('/messages', options);
};

export const getMessages = async (channel = 'general') => {
    return apiRequest(`/messages/${channel}`);
};

/* --- USERS --- */
export const createUser = async (userData) => {
    // userData contains { username, email, password }
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    if (data.token) localStorage.setItem('token', data.token);
    return data.user;
};

export const verifyUser = async (credentials) => {
    // credentials contains { passcode } (or just pass the string)
    const accessCode = credentials.passcode || credentials;
    const data = await apiRequest('/auth/access', {
        method: 'POST',
        body: JSON.stringify({ passcode: accessCode })
    });
    if (data.token) localStorage.setItem('token', data.token);
    return data.user;
};

export const getUserById = (id) => apiRequest(`/auth/user/${id}`);

export const findUserByUsernameOrPasscode = async (query) => {
    // This might need a new endpoint on backend or handled differently
    // For now, let's assume we search users
    return apiRequest(`/auth/search?query=${query}`);
};


/* --- FRIENDS (Mocked for now or can be added to backend) --- */
export const sendFriendRequest = async (fromUserId, toUserId) => {
    // Implement on backend as needed
    console.log('Friend request from', fromUserId, 'to', toUserId);
};

export const getPendingRequests = async (userId) => {
    return []; // Implement on backend
};

export const acceptFriendRequest = async (requestId) => {
    // Implement on backend
};
