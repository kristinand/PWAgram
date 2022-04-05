import { openDb } from 'idb';
import { ICard, EStores } from '../types';

const dbVersion = 1;

const dbPromise = openDb('posts-store', dbVersion, (db) => {
  if (!db.objectStoreNames.contains(EStores.Posts)) {
    db.createObjectStore(EStores.Posts, { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains(EStores.SyncPosts)) {
    db.createObjectStore(EStores.SyncPosts, { keyPath: 'id' });
  }
});

export function writeData(storeName: string, data: ICard) {
  return dbPromise.then((db) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(data);
    return tx.complete; // return on every write operation, finish the transaction successfully
  });
}

export function readAllData(storeName: string) {
  return dbPromise.then((db) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return store.getAll();
  });
}

export function clearAllData(storeName: string) {
  return dbPromise.then((db) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    return tx.complete;
  });
}

export function clearOne(storeName: string, id: string) {
  return dbPromise
    .then((db) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      return tx.complete;
    })
    .then(() => {
      console.log('Item deleted');
    });
}
