/* globals log */

export class Database {
  constructor(dbName) {
    this.dbName = dbName;
    this.readonly = "readonly";
    this.readwrite = "readwrite";
  }

  createTable(TBName, primaryKey, version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, version);
      request.onupgradeneeded = e => {
        const database = e.target.result;
        database.createObjectStore(TBName, {
          keyPath: primaryKey,
        });
      };
      request.onsuccess = e => {
        const database = e.target.result;
        resolve(database);
      };
      request.onerror = e => {
        const code = e.target.errorCode;
        reject(new Error(`Failed to create a database: ${code}`));
      };
    });
  }

  get(primaryKey, TBName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = e => {
        const database = e.target.result;
        const transaction = database.transaction([TBName]);
        const objectStore = transaction.objectStore(TBName);
        const read = objectStore.get(primaryKey);
        read.onsuccess = e => {
          log.info("Got result:", read.result);
          resolve(read.result);
        };
        read.onerror = e => {
          const code = e.target.errorCode;
          reject(new Error(`Unable to retrieve data from database: ${code}`));
        };
        database.close();
      };
      request.onerror = e => {
        const code = e.target.errorCode;
        reject(new Error(`Unable to retrieve from database: ${code}`));
      };
    });
  }

  /*
   * direction can be "prev" or "next"
   * "prev" is most recent first (based on primaryKey)
   * "next" is most recent last (based on primaryKey)
   */
  getAll(TBName, direction) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = e => {
        const database = e.target.result;
        const objectStore = database.transaction(TBName).objectStore(TBName);
        const list = [];
        // default to most recent first if direction is null
        const request = direction
          ? objectStore.openCursor(null, direction)
          : objectStore.openCursor(null, "prev");
        request.onsuccess = e => {
          const cursor = e.target.result;
          if (cursor) {
            list.push(cursor.value);
            cursor.continue();
          } else {
            resolve(list);
          }
        };
        request.onerror = e => {
          const code = e.target.errorCode;
          reject(new Error(`Unable to retrieve data from database: ${code}`));
        };
      };
    });
  }

  add(obj, TBName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = e => {
        const database = e.target.result;
        const add = database
          .transaction([TBName], this.readwrite)
          .objectStore(TBName)
          .add(obj);
        add.onsuccess = e => {
          log.info("1 record has been added to your database.");
          resolve();
        };
        add.onerror = e => {
          const code = e.target.errorCode;
          reject(new Error(`Unable to add data records: ${code}`));
        };
        database.close();
      };
    });
  }

  delete(primaryKey, TBName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = e => {
        const database = e.target.result;
        const remove = database
          .transaction([TBName], this.readwrite)
          .objectStore(TBName)
          .delete(primaryKey);
        remove.onsuccess = e => {
          log.info("This entry has been removed from your database.");
          resolve();
        };
        remove.onerror = e => {
          const code = e.target.errorCode;
          reject(new Error(`Entry could not be removed in databse: ${code}`));
        };
        database.close();
      };
    });
  }

  clearAll(TBName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = e => {
        const database = e.target.result;
        const objectStore = database
          .transaction(TBName, this.readwrite)
          .objectStore(TBName);
        const clear = objectStore.clear();
        clear.onsuccess = e => {
          log.info("Successfully removed all entries in the table");
          resolve();
        };
        clear.onerror = e => {
          const code = e.target.errorCode;
          reject(new Error(`Failed to remove entries in database: ${code}`));
        };
        database.close();
      };
    });
  }
}
