const db = new Dexie("SinarPagiDB");

db.version(8).stores({
    products: '++id, name, code, category, price_modal, price_sell, qty, unit',
    categories: '++id, name',
    transactions: '++id, date, total, memberId, paymentMethod, amountPaid, change, status, payments',
    members: '++id, name, phone, address',
    settings: 'id, storeName'
});

const syncToCloud = (table, id, data) => {
    if (typeof fdb !== 'undefined' && data !== undefined) {
        const ref = fdb.ref(table + '/' + id);
        if (data === null) {
            ref.remove();
        } else {
            ref.set(JSON.parse(JSON.stringify(data)));
        }
    }
};

// Hooks Products
db.products.hook('creating', (pk, obj) => syncToCloud('products', pk || obj.id, obj));
db.products.hook('updating', (mods, pk, obj) => syncToCloud('products', pk, obj));
db.products.hook('deleting', (pk) => syncToCloud('products', pk, null));

// Hooks Members
db.members.hook('creating', (pk, obj) => syncToCloud('members', pk || obj.id, obj));
db.members.hook('updating', (mods, pk, obj) => syncToCloud('members', pk, obj));
db.members.hook('deleting', (pk) => syncToCloud('members', pk, null));

// Hooks Transactions (PENTING UNTUK CICILAN)
db.transactions.hook('creating', (pk, obj) => syncToCloud('transactions', pk || obj.id, obj));
db.transactions.hook('updating', (mods, pk, obj) => {
    db.transactions.get(pk).then(updatedData => {
        if (updatedData) syncToCloud('transactions', pk, updatedData);
    });
});
db.transactions.hook('deleting', (pk) => syncToCloud('transactions', pk, null));

db.open().catch(err => console.error("DB Error:", err));
