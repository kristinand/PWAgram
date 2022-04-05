// @ts-nocheck
import * as idb from '../lib/idb.js';

var dbPromise = idb.open('posts-store', 1, (db) => {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', { keyPath: 'id' });
  }
  if (!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', { keyPath: 'id' });
  }
});

export function writeData(st, data) {
  return dbPromise.then((db) => {
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    store.put(data);
    return tx.complete; // return on every write operation, finish the transaction successfully
  });
}

export function readAllData(st) {
  return dbPromise.then((db) => {
    const tx = db.transaction(st, 'readonly');
    const store = tx.objectStore(st);
    return store.getAll();
  });
}

export function clearAllData(st) {
  return dbPromise.then((db) => {
    const tx = db.transaction(st, 'readwrite');
    const store = tx.objectStore(st);
    store.clear();
    return tx.complete;
  });
}

export function clearOne(st, id) {
  return dbPromise
    .then((db) => {
      const tx = db.transaction(st, 'readwrite');
      const store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then(() => {
      console.log('Item deleted');
    });
}
