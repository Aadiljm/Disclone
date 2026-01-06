const DB_NAME = 'DiscloneDB';
const STORES = {
    MESSAGES: 'messages',
    USERS: 'users',
    FRIEND_REQUESTS: 'friend_requests'
};
const DB_VERSION = 2; // Bump version for new stores

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject(event.target.error);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
                db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.USERS)) {
                const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
                userStore.createIndex('username', 'username', { unique: false });
                userStore.createIndex('passcode', 'passcode', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.FRIEND_REQUESTS)) {
                const reqStore = db.createObjectStore(STORES.FRIEND_REQUESTS, { keyPath: 'id' });
                reqStore.createIndex('toUserId', 'toUserId', { unique: false });
                reqStore.createIndex('fromUserId', 'fromUserId', { unique: false });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
    });
};

// Generic Helper
const performTransaction = async (storeName, mode, callback) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], mode);
        const store = transaction.objectStore(storeName);
        const request = callback(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

/* --- MESSAGES --- */
export const addMessage = (message) => performTransaction(STORES.MESSAGES, 'readwrite', store => store.add(message));
export const getMessages = () => performTransaction(STORES.MESSAGES, 'readonly', store => store.getAll());

/* --- USERS --- */
export const createUser = async (username) => {
    // Generate a secure 6-digit passcode
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();
    const user = {
        id: crypto.randomUUID(),
        username,
        passcode,
        friends: [], // Array of user IDs
        joinedAt: Date.now()
    };
    await performTransaction(STORES.USERS, 'readwrite', store => store.add(user));
    return user;
};

export const verifyUser = async (username, passcode) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.USERS], 'readonly');
        const store = transaction.objectStore(STORES.USERS);
        const index = store.index('username');
        const request = index.getAll(username);

        request.onsuccess = () => {
            const users = request.result;
            const validUser = users.find(u => u.passcode === passcode);
            if (validUser) resolve(validUser);
            else resolve(null);
        };
        request.onerror = (e) => reject(e.target.error);
    });
};

export const getUserById = (id) => performTransaction(STORES.USERS, 'readonly', store => store.get(id));

export const findUserByUsernameOrPasscode = async (query) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.USERS], 'readonly');
        const store = transaction.objectStore(STORES.USERS);
        const allReq = store.getAll();

        allReq.onsuccess = () => {
            const users = allReq.result;
            // Exact match on username or passcode
            const match = users.find(u => u.username === query || u.passcode === query);
            resolve(match);
        };
        allReq.onerror = (e) => reject(e.target.error);
    });
};


/* --- FRIENDS --- */
export const sendFriendRequest = async (fromUserId, toUserId) => {
    if (fromUserId === toUserId) throw new Error("Cannot add self");

    // Check if already friends or requested
    const existing = await performTransaction(STORES.FRIEND_REQUESTS, 'readonly', store => store.getAll());
    const duplicate = existing.find(r =>
        (r.fromUserId === fromUserId && r.toUserId === toUserId) ||
        (r.fromUserId === toUserId && r.toUserId === fromUserId)
    );
    if (duplicate) return; // Already exists

    const request = {
        id: crypto.randomUUID(),
        fromUserId,
        toUserId,
        status: 'pending',
        timestamp: Date.now()
    };
    return performTransaction(STORES.FRIEND_REQUESTS, 'readwrite', store => store.add(request));
};

export const getPendingRequests = async (userId) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.FRIEND_REQUESTS], 'readonly');
        const store = transaction.objectStore(STORES.FRIEND_REQUESTS);
        const index = store.index('toUserId');
        const request = index.getAll(userId);

        request.onsuccess = () => {
            const reqs = request.result.filter(r => r.status === 'pending');
            resolve(reqs);
        };
        request.onerror = (e) => reject(e.target.error);
    });
};

// Accept request: Add to both friend lists and delete request
export const acceptFriendRequest = async (requestId) => {
    const db = await initDB();
    const transaction = db.transaction([STORES.USERS, STORES.FRIEND_REQUESTS], 'readwrite');

    const reqStore = transaction.objectStore(STORES.FRIEND_REQUESTS);
    const userStore = transaction.objectStore(STORES.USERS);

    return new Promise((resolve, reject) => {
        const reqRequest = reqStore.get(requestId);

        reqRequest.onsuccess = () => {
            const req = reqRequest.result;
            if (!req) return resolve();

            // Add friends
            // We need to fetch both users first
            // IndexedDB chaining is tricky, simplifying by just updating if we can or doing loose updates
            // A proper backend would be atomic. Here we do best effort.

            const p1 = new Promise(res => {
                userStore.get(req.fromUserId).onsuccess = (e) => {
                    const u = e.target.result;
                    if (!u.friends) u.friends = [];
                    if (!u.friends.includes(req.toUserId)) u.friends.push(req.toUserId);
                    userStore.put(u).onsuccess = res;
                }
            });

            const p2 = new Promise(res => {
                userStore.get(req.toUserId).onsuccess = (e) => {
                    const u = e.target.result;
                    if (!u.friends) u.friends = [];
                    if (!u.friends.includes(req.fromUserId)) u.friends.push(req.fromUserId);
                    userStore.put(u).onsuccess = res;
                }
            });

            Promise.all([p1, p2]).then(() => {
                reqStore.delete(requestId).onsuccess = () => resolve();
            });
        };
        reqRequest.onerror = reject;
    });
};
