# Practical: Client-Side Storage with IndexedDB Cache

## Problem Title: IndexedDB Key-Value Cache with TTL & LRU Eviction

## Difficulty: Senior

## Skills Tested
- IndexedDB database connection, transactions, and store operations
- Asynchronous API wrapping with JavaScript Promises
- Least Recently Used (LRU) cache eviction algorithm
- Timestamp-based TTL (Time-To-Live) expiration checks

## Problem Statement
In offline-first applications or when caching API responses client-side, LocalStorage is too small (~5MB) and blocks the main thread. IndexedDB is asynchronous and has large limits, but it lacks built-in TTL expiration or entry size limits.

Implement a class `IndexedDBCache` that provides a key-value store backed by IndexedDB. It must:
1. Initialize connection to a specified database and store.
2. Expose an async `get(key)` method. It returns the value if it exists, is not expired, and updates its access timestamp. If expired, it deletes the item and returns `null`.
3. Expose an async `set(key, value, ttlMs)` method. It saves the value along with its expiry time.
4. Implement a maximum capacity limit (e.g. 5 items for demonstration, configurable). If saving an item causes the store to exceed capacity, evict the least recently accessed item (LRU) based on a `lastAccessed` timestamp.

## Starter Code
```javascript
/**
 * Asynchronous, IndexedDB-backed key-value cache with LRU eviction.
 */
export class IndexedDBCache {
  constructor(dbName, storeName, maxCapacity = 5) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.maxCapacity = maxCapacity;
    this.db = null;
  }

  /**
   * Initializes connection to IndexedDB.
   */
  async init() {
    // Implement
  }

  /**
   * Retrieves an item. Returns null if missing or expired.
   */
  async get(key) {
    // Implement
  }

  /**
   * Saves an item. Evicts LRU item if capacity is exceeded.
   */
  async set(key, value, ttlMs = 60000) {
    // Implement
  }
}
```

## Requirements
- All database operations (`init`, `get`, `set`) must be asynchronous and return Promises.
- Evict expired items automatically during operations.
- The LRU cache must update the `lastAccessed` timestamp of an item on every successful `get` call.
- The database store must be initialized inside the `onupgradeneeded` lifecycle hook of the IndexedDB open request.

## Edge Cases
- Initializing the database multiple times.
- Storing objects, arrays, or binary blobs (which IndexedDB supports natively, unlike LocalStorage).
- Concurrent calls to `set` before the database is initialized.

## Expected Approach
We wrap standard IndexedDB request events (`success`, `error`, `upgradeneeded`) in JavaScript Promises.
Inside `init`, we open the connection: `indexedDB.open(dbName, version)`. In `onupgradeneeded`, we check if the object store exists; if not, we call `createObjectStore`.
For `get(key)`:
1. Start a `readwrite` transaction.
2. Fetch the record: `store.get(key)`.
3. Check if current time exceeds `expiry`. If yes, call `store.delete(key)` and return `null`.
4. Otherwise, update the record's `lastAccessed = Date.now()` and call `store.put(record)`. Return the value.

For `set(key, value, ttlMs)`:
1. Start a `readwrite` transaction.
2. Count the database records: `store.count()`.
3. If count matches or exceeds `maxCapacity`, retrieve all records, sort them by `lastAccessed` ascending, find the oldest item, and delete it.
4. Save the new record: `{ key, value, expiry: Date.now() + ttlMs, lastAccessed: Date.now() }`.

## Solution
```javascript
export class IndexedDBCache {
  constructor(dbName, storeName, maxCapacity = 5) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.maxCapacity = maxCapacity;
    this.db = null;
  }

  /**
   * Opens connection to the IndexedDB instance.
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(new Error(`IndexedDB open failed: ${event.target.error}`));
      };
    });
  }

  /**
   * Returns a reference to the target object store.
   */
  _getStore(mode) {
    const transaction = this.db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  /**
   * Retrieves a value from the cache, validating TTL and updating LRU.
   */
  async get(key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const store = this._getStore("readwrite");
      const request = store.get(key);

      request.onsuccess = () => {
        const record = request.result;
        if (!record) {
          return resolve(null);
        }

        // Check if expired
        if (Date.now() > record.expiry) {
          // Asynchronously delete expired record
          const delStore = this._getStore("readwrite");
          delStore.delete(key);
          return resolve(null);
        }

        // Update lastAccessed timestamp for LRU tracking
        record.lastAccessed = Date.now();
        const updateStore = this._getStore("readwrite");
        const updateRequest = updateStore.put(record);

        updateRequest.onsuccess = () => {
          resolve(record.value);
        };
        updateRequest.onerror = (event) => {
          reject(event.target.error);
        };
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Saves a value to the cache, evicting the oldest item if at capacity.
   */
  async set(key, value, ttlMs = 60000) {
    await this.init();

    return new Promise(async (resolve, reject) => {
      try {
        // 1. Evict oldest item if capacity is exceeded
        await this._evictIfNecessary(key);

        const store = this._getStore("readwrite");
        const record = {
          key,
          value,
          expiry: Date.now() + ttlMs,
          lastAccessed: Date.now()
        };

        const request = store.put(record);
        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Checks current item count and deletes the oldest LRU item if at limit.
   */
  async _evictIfNecessary(newKey) {
    return new Promise((resolve, reject) => {
      const store = this._getStore("readonly");
      
      // Check if item already exists (updates won't increase item count)
      const checkRequest = store.get(newKey);
      
      checkRequest.onsuccess = () => {
        const exists = !!checkRequest.result;
        if (exists) return resolve(); // Overwrite won't violate capacity

        const countStore = this._getStore("readonly");
        const countRequest = countStore.count();

        countRequest.onsuccess = () => {
          if (countRequest.result < this.maxCapacity) {
            return resolve(); // Under capacity limit
          }

          // At capacity: retrieve all records to locate oldest
          const allStore = this._getStore("readonly");
          const allRequest = allStore.getAll();

          allRequest.onsuccess = () => {
            const records = allRequest.result;
            if (records.length === 0) return resolve();

            // Find item with lowest lastAccessed timestamp
            let oldest = records[0];
            for (let i = 1; i < records.length; i++) {
              if (records[i].lastAccessed < oldest.lastAccessed) {
                oldest = records[i];
              }
            }

            // Delete the oldest item
            const deleteStore = this._getStore("readwrite");
            const deleteRequest = deleteStore.delete(oldest.key);
            
            deleteRequest.onsuccess = () => {
              console.log(`IndexedDBCache: Evicted LRU item key "${oldest.key}"`);
              resolve();
            };
            deleteRequest.onerror = (e) => reject(e.target.error);
          };
        };
      };
      
      checkRequest.onerror = (e) => reject(e.target.error);
    });
  }
}
```

## Explanation
- **Non-blocking Execution**: Connection opening and transactions are wrapped in Promises. Callbacks resolve/reject asynchronously, keeping the main thread free.
- **TTL Eviction**: Inside `get`, we read the `expiry` timestamp. If it is less than `Date.now()`, the item is removed, ensuring outdated API cache payloads are never returned to widgets.
- **LRU Eviction**: Records contain a `lastAccessed` timestamp. In `_evictIfNecessary`, if the count matches `maxCapacity`, we retrieve all items, select the one with the smallest `lastAccessed` value, and delete it.

## Time Complexity
- **Connection initialization**: $O(1)$ constant time.
- **Get / Set operations**: $O(\log K)$ where $K$ is the number of keys (IndexedDB uses B-Trees under the hood for key indexes).
- **Eviction calculations**: $O(C)$ where $C$ is `maxCapacity` (sorting the small set of cached keys to find the oldest).

## Space Complexity
- **Memory footprint**: $O(1)$ RAM usage, as data is persisted in disk-based storage rather than JavaScript memory variables.

---

## Interviewer Follow-ups
1. "What if `maxCapacity` was set to 10,000 items? Would `getAll` become a performance issue?"
   (Yes. Loading 10,000 objects in memory to sort them is slow. Instead of `getAll()`, open a database **Cursor** (`openCursor`), traverse the index, or build a secondary IndexedDB Index specifically on the `lastAccessed` property so we can query only the first item in the sorted index directly).
2. "How would you handle database connection errors on browsers that don't support IndexedDB?"
   (Implement a fallback memory store using a basic JavaScript `Map` or fall back to cookies/session storage if capacity permits).

---

## Senior-Level Discussion
Developing async wrappers for low-level browser APIs shows solid asynchronous programming skills.
This IndexedDBCache matches the functionality of server-side Redis setups, allowing frontend developers to cache heavy REST or GraphQL payloads safely without hitting LocalStorage limit exceptions or degrading client UI speeds.
In production apps, combining this storage setup with Service Workers allows the application to act as an offline-first PWA, loading instantly on repeat visits.
