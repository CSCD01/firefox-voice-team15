/* globals log */

export class Database {
  constructor(dbName) {
    this.dbName = dbName;
    this.readonly = "readonly";
    this.readwrite = "readwrite";
    this.order = "prev";
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
          log.info("Got result:", read.result);
          resolve(read.result);
        };
        read.onerror = e => {
          reject(
            new Error(
              `Unable to retrieve data from database: ${e.target.errorCode}`
            )
          );
        };
        database.close();
      };
      request.onerror = e => {
        reject(
          new Error(`Unable to retrieve from database: ${e.target.errorCode}`)
        );
      };
    });
  }

  getAll(TBName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = e => {
        const database = e.target.result;
        const objectStore = database.transaction(TBName).objectStore(TBName);
        const list = [];
        // return all objects from the object store according to `this.order`
        const request = objectStore.openCursor(null, this.order);
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
          reject(
            new Error(
              `Unable to retrieve all data from database: ${e.target.errorCode}`
            )
          );
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
          reject(
            new Error(`Unable to add data records: ${e.target.errorCode}`)
          );
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
          log.info("1 record has been added to your database.");
          resolve();
        };
        remove.onerror = e => {
          reject(
            new Error(
              `This entry could not be removed from database: ${e.target.errorCode}`
            )
          );
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
          reject(
            new Error(
              `Failed to remove entries in table: ${e.target.errorCode}`
            )
          );
        };
        database.close();
      };
    });
  }
}
