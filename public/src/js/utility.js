var DB_NAME = 'posts';

var dbPromise = idb.open('posts-store', 1, (db) => {
  if (!db.objectStoreNames.contains(DB_NAME)) {
    db.createObjectStore(DB_NAME, { keyPath: 'id' });
  }
});

function writeData(data) {
  return dbPromise.then((db) => {
    const tx = db.transaction(DB_NAME, 'readwrite');
    const store = tx.objectStore(DB_NAME);
    store.put(data);
    return tx.complete; // return on every write operation, finish the transaction successfully
  });
}

function readAllData() {
  return dbPromise.then((db) => {
    const tx = db.transaction(DB_NAME, 'readonly');
    const store = tx.objectStore(DB_NAME);
    return store.getAll();
  });
}

function clearAllData() {
  return dbPromise.then((db) => {
    const tx = db.transaction(DB_NAME, 'readwrite');
    const store = tx.objectStore(DB_NAME);
    store.clear();
    return tx.complete;
  });
}

function clearOne(id) {
  return dbPromise
    .then((db) => {
      const tx = db.transaction(DB_NAME, 'readwrite');
      const store = tx.objectStore(DB_NAME);
      store.delete(id);
      return tx.complete;
    })
    .then(() => {
      console.log('Item deleted');
    });
}
