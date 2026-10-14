/**
 * Mock Test Viewer — Database Engine (db.js)
 * High-performance on-device IndexedDB storage with in-memory fallback.
 * Record Schema:
 *   { id: string, name: string, html: string, size: number, added: number, lastOpened: number }
 */

const DB_NAME = 'MockTestViewerDB';
const DB_VERSION = 1;
const STORE_NAME = 'tests';

// State flags
let dbInstance = null;
let isMemoryFallback = false;
const memoryStore = new Map();

/**
 * Request persistent storage from iOS Safari (navigator.storage.persist)
 */
export async function requestStoragePersistence() {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (err) {
      console.warn('[Storage] Error requesting persistence:', err);
      return false;
    }
  }
  return false;
}

/**
 * Check whether storage is currently persisted
 */
export async function isStoragePersisted() {
  if (navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Initialize IndexedDB with graceful fallback to in-memory storage
 * @returns {Promise<{ isFallback: boolean, persisted: boolean, error?: string }>}
 */
export function initDB() {
  return new Promise((resolve) => {
    if (!('indexedDB' in window)) {
      isMemoryFallback = true;
      console.warn('[DB] IndexedDB is not supported on this browser. Falling back to memory storage.');
      resolve({ isFallback: true, persisted: false, error: 'IndexedDB is not supported.' });
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('added', 'added', { unique: false });
          store.createIndex('lastOpened', 'lastOpened', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        dbInstance = event.target.result;
        isMemoryFallback = false;

        dbInstance.onversionchange = () => {
          dbInstance.close();
          console.warn('[DB] Database version change detected, connection closed.');
        };

        const persisted = await requestStoragePersistence();
        resolve({ isFallback: false, persisted });
      };

      request.onerror = (event) => {
        console.error('[DB] IndexedDB open error, engaging in-memory fallback:', event.target.error);
        isMemoryFallback = true;
        resolve({
          isFallback: true,
          persisted: false,
          error: event.target.error ? event.target.error.message : 'Database access denied.'
        });
      };

      request.onblocked = () => {
        console.warn('[DB] Database open blocked by another tab.');
      };
    } catch (err) {
      console.error('[DB] Exception while opening IndexedDB:', err);
      isMemoryFallback = true;
      resolve({ isFallback: true, persisted: false, error: err.message });
    }
  });
}

/**
 * Get all tests sorted by lastOpened descending
 * @returns {Promise<Array>}
 */
export function getAllTests() {
  return new Promise((resolve, reject) => {
    if (isMemoryFallback || !dbInstance) {
      const all = Array.from(memoryStore.values());
      all.sort((a, b) => (b.lastOpened || b.added) - (a.lastOpened || a.added));
      resolve(all);
      return;
    }

    try {
      const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const tests = request.result || [];
        tests.sort((a, b) => (b.lastOpened || b.added) - (a.lastOpened || a.added));
        resolve(tests);
      };

      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Get a single test by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export function getTestById(id) {
  return new Promise((resolve, reject) => {
    if (isMemoryFallback || !dbInstance) {
      resolve(memoryStore.get(id) || null);
      return;
    }

    try {
      const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Find an existing test by exact title/name
 * @param {string} name
 * @returns {Promise<Object|null>}
 */
export function getTestByName(name) {
  return new Promise((resolve, reject) => {
    if (isMemoryFallback || !dbInstance) {
      for (const item of memoryStore.values()) {
        if (item.name === name) return resolve(item);
      }
      return resolve(null);
    }

    try {
      const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('name');
      const request = index.get(name);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Save or update a test record
 * @param {Object} test - { id, name, html, size, added, lastOpened }
 * @returns {Promise<string>}
 */
export function saveTest(test) {
  return new Promise((resolve, reject) => {
    if (!test.id) {
      test.id = 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }
    if (!test.added) {
      test.added = Date.now();
    }
    if (!test.lastOpened) {
      test.lastOpened = 0;
    }

    if (isMemoryFallback || !dbInstance) {
      memoryStore.set(test.id, test);
      resolve(test.id);
      return;
    }

    try {
      const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(test);

      request.onsuccess = () => resolve(test.id);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Delete a test by ID
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export function deleteTest(id) {
  return new Promise((resolve, reject) => {
    if (isMemoryFallback || !dbInstance) {
      const existed = memoryStore.delete(id);
      resolve(existed);
      return;
    }

    try {
      const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Clear all test records (used for restore in replace mode)
 * @returns {Promise<void>}
 */
export function clearAllTests() {
  return new Promise((resolve, reject) => {
    if (isMemoryFallback || !dbInstance) {
      memoryStore.clear();
      resolve();
      return;
    }

    try {
      const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Update the lastOpened timestamp of a test
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function updateTestLastOpened(id) {
  const test = await getTestById(id);
  if (test) {
    test.lastOpened = Date.now();
    await saveTest(test);
  }
}

/**
 * Rename a test
 * @param {string} id
 * @param {string} newName
 * @returns {Promise<void>}
 */
export async function renameTest(id, newName) {
  const test = await getTestById(id);
  if (!test) throw new Error('Test not found');
  test.name = newName;
  await saveTest(test);
}

/**
 * Calculate total storage size and count of saved tests
 * @returns {Promise<{ count: number, totalBytes: number, formattedSize: string }>}
 */
export async function getStorageStats() {
  const tests = await getAllTests();
  let totalBytes = 0;
  for (const t of tests) {
    totalBytes += t.size || (t.html ? t.html.length : 0);
  }
  return {
    count: tests.length,
    totalBytes,
    formattedSize: formatBytes(totalBytes)
  };
}

/**
 * Helper to format bytes into readable KB/MB
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
