/* globals log */

export class Database {
  constructor(dbName) {
    this.dbName = dbName;
    this.readonly = "readonly";
    this.readwrite = "readwrite";
  }

  createTable(TBName, primaryKey) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
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
        reject(new Error(`Failed to create a database: ${e.target.errorCode}`));
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
          log.info("get result:", read.result);
          resolve(read.result);
        };
        read.onerror = e => {
          reject(new Error(`Unable to retrieve data from database: ${e.target.errorCode}`));
        };
        database.close();
      };
      request.onerror = e => {
        reject(new Error(`Unable to retrieve from database: ${e.target.errorCode}`));
      };
    });
  }

  getAll(TBName) {
    return new Promise(resolve => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = e => {
        const database = e.target.result;
        const objectStore = database.transaction(TBName).objectStore(TBName);
        const list = [];

        objectStore.openCursor().onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            list.push(cursor.value);
            cursor.continue();
          } else {
            resolve(list);
          }
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
          // log.info("1 record has been added to your database.");
          resolve("1 record has been added to your database.");
        };
        add.onerror = e => {
          reject(new Error(`Unable to add data records: ${e.target.errorCode}`));
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
          resolve("This entry has been removed from your database.");
        };
        remove.onerror = e => {
          reject(new Error(`This entry could not be removed from database: ${e.target.errorCode}`));
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
          resolve("Successfully removed all entries in the table");
        };
        clear.onerror = e => {
          reject(new Error(`Failed to remove entries in table: ${e.target.errorCode}`));
        };
        database.close();
      };
    });
  }
}
