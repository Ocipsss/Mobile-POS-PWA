// js/database.js //
const db = new Dexie("SinarPagiDB");

// Versi 12: Menambahkan tabel expenses untuk mencatat pengeluaran
db.version(12).stores({
    products: '++id, name, code, category, price_modal, price_sell, qty, unit',
    categories: '++id, name',
    transactions: '++id, date, total, memberId, paymentMethod, amountPaid, change, status',
    members: 'id, name, phone, address, total_spending, points', 
    expenses: '++id, date, category, amount, note',
    settings: 'id, storeName'
});

// --- FUNGSI SINKRONISASI KELUAR (LOCAL -> CLOUD) ---
const syncToCloud = (table, id, data) => {
    if (typeof fdb !== 'undefined' && id !== undefined && id !== null) {
        try {
            const ref = fdb.ref(table + '/' + id);
            if (data === null) {
                ref.remove();
            } else {
                const cleanData = JSON.parse(JSON.stringify(data));
                ref.set(cleanData);
            }
        } catch (e) {
            console.warn(`Cloud Sync Failed [${table}]:`, e.message);
        }
    }
};

// --- HOOKS DATABASE (SINKRONISASI OTOMATIS) ---

// Products
db.products.hook('creating', (pk, obj) => { syncToCloud('products', pk || obj.id, obj); });
db.products.hook('updating', (mods, pk, obj) => { syncToCloud('products', pk, obj); });
db.products.hook('deleting', (pk) => { syncToCloud('products', pk, null); });

// Members
db.members.hook('creating', (pk, obj) => { syncToCloud('members', pk || obj.id, obj); });
db.members.hook('updating', (mods, pk, obj) => { syncToCloud('members', pk, obj); });
db.members.hook('deleting', (pk) => { syncToCloud('members', pk, null); });

// Categories
db.categories.hook('creating', (pk, obj) => { syncToCloud('categories', pk || obj.id, obj); });
db.categories.hook('updating', (mods, pk, obj) => { syncToCloud('categories', pk, obj); });
db.categories.hook('deleting', (pk) => { syncToCloud('categories', pk, null); });

// Expenses (BARU)
db.expenses.hook('creating', (pk, obj) => { syncToCloud('expenses', pk || obj.id, obj); });
db.expenses.hook('updating', (mods, pk, obj) => { syncToCloud('expenses', pk, obj); });
db.expenses.hook('deleting', (pk) => { syncToCloud('expenses', pk, null); });

// Transactions
db.transactions.hook('creating', (pk, obj) => { syncToCloud('transactions', pk || obj.id, obj); });
db.transactions.hook('updating', (mods, pk, obj) => {
    setTimeout(() => {
        db.transactions.get(pk).then(updated => {
            if (updated) syncToCloud('transactions', pk, updated);
        });
    }, 200);
});
db.transactions.hook('deleting', (pk) => { syncToCloud('transactions', pk, null); });


// --- FUNGSI SINKRONISASI MASUK (CLOUD -> LOCAL) ---
const syncFromCloud = () => {
    if (typeof fdb === 'undefined') return;

    // Menambahkan 'expenses' ke daftar tabel yang dipantau
    const tables = ['products', 'categories', 'transactions', 'members', 'expenses'];
    tables.forEach(tableName => {
        const ref = fdb.ref(tableName);
        
        ref.on('child_added', async (snapshot) => {
            const data = snapshot.val();
            if (data) await db[tableName].put(data); 
        });

        ref.on('child_changed', async (snapshot) => {
            const data = snapshot.val();
            if (data) await db[tableName].put(data);
        });

        ref.on('child_removed', async (snapshot) => {
            const id = snapshot.key;
            const targetId = isNaN(id) ? id : Number(id);
            await db[tableName].delete(targetId);
        });
    });
};

// --- HELPER LABA RUGI (Hanya Penjualan Produk) ---
window.hitungLabaRugi = async (startDate, endDate) => {
    try {
        const semuaTransaksi = await db.transactions
            .where('date').between(startDate, endDate, true, true)
            .toArray();

        let stats = {
            totalOmzet: 0,
            totalModal: 0,
            totalLabaBersih: 0,
            count: semuaTransaksi.length
        };

        semuaTransaksi.forEach(tr => {
            stats.totalOmzet += Number(tr.total || 0);
            if (tr.items && Array.isArray(tr.items)) {
                tr.items.forEach(item => {
                    const qty = Number(item.qty || 0);
                    const modal = Number(item.price_modal || 0);
                    stats.totalModal += (modal * qty);
                    
                    if (typeof item.profit !== 'undefined') {
                        stats.totalLabaBersih += Number(item.profit);
                    } else {
                        stats.totalLabaBersih += (Number(item.price_sell) - modal) * qty;
                    }
                });
            }
        });

        return stats;
    } catch (err) {
        console.error("Gagal hitung laba:", err);
        return { totalOmzet: 0, totalModal: 0, totalLabaBersih: 0, count: 0 };
    }
};

// --- EKSEKUSI JALANKAN DATABASE ---
db.open().then(() => {
    console.log("Database SinarPagiDB v12 Aktif (Expenses Added)");
    syncFromCloud(); 
}).catch(err => {
    console.error("Koneksi Database Gagal:", err);
});
