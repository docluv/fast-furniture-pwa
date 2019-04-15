

class idbKeyval {
    
        constructor(cachedb, dbname) {
    
            if (!dbname || typeof dbname !== "string") {
                console.error('bad dbname');
            }
    
    
            if (!cachedb) {
                console.error('bad cachedb');
            }
    
            this.cachedb = cachedb;
            this.dbname = dbname;
    
        }
    
        get(key) {
            return this.cachedb.then(db => {
                return db.transaction(this.dbname)
                    .objectStore(this.dbname).get(key);
            });
        }
    
        put(key, val) {
            return this.cachedb.then(db => {
                const tx = db.transaction(this.dbname, 'readwrite');
                tx.objectStore(this.dbname).put(val, key);
                return tx.complete;
            });
        }
    
        delete(key) {
            return this.cachedb.then(db => {
                const tx = db.transaction(this.dbname, 'readwrite');
                tx.objectStore(this.dbname).delete(key);
                return tx.complete;
            });
        }
    
        clear() {
            return this.cachedb.then(db => {
                const tx = db.transaction(this.dbname, 'readwrite');
                tx.objectStore(this.dbname).clear();
                return tx.complete;
            });
        }
    
        keys() {
            return this.cachedb.then(db => {
                const tx = db.transaction(this.dbname);
                const keys = [];
                const store = tx.objectStore(this.dbname);
    
                // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
                // openKeyCursor isn't supported by Safari, so we fall back
                (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
                    if (!cursor) return;
                    keys.push(cursor.key);
                    cursor.continue();
                });
    
                return tx.complete.then(() => keys);
            });
        }
    
    }
    