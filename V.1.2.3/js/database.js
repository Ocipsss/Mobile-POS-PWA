// js/database.js
const db = new Dexie("SinarPagiDB");

window.generateUID = () => {
    return 'SP-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
};

db.version(18).stores({
    products: 'id, name, code, category, price_modal, price_sell, qty, unit',
    categories: '++id, name', 
    transactions: 'id, date, total, memberId, paymentMethod, amountPaid, change, status',
    members: 'id, name, phone, address, total_spending, points', 
    expenses: 'id, date, category, amount, note, paymentMethod, cashPart, qrisPart',
    digital_transactions: 'id, date, type, provider, nominal, adminFee, adminPaymentMethod, totalReceived, profit',
    settings: 'id, storeName',
    services: '++id, name, price' 
});

// Flag untuk mencegah loop sinkronisasi saat import atau sync dari cloud
window.isSyncing = false;

// --- FUNGSI SINKRONISASI KELUAR (LOCAL -> CLOUD) ---
const syncToCloud = (table, id, data) => {
    // JANGAN kirim ke cloud jika data berasal dari proses sinkronisasi masuk (mencegah loop)
    if (window.isSyncing) return;

    if (typeof fdb !== 'undefined' && id) {
        try {
            const ref = fdb.ref(table + '/' + id);
            if (data === null) {
                ref.remove();
            } else {
                // Pastikan data bersih dari properti non-JSON
                const cleanData = JSON.parse(JSON.stringify(data));
                ref.set(cleanData);
            }
        } catch (e) {
            console.warn(`Cloud Sync Failed [${table}]:`, e.message);
        }
    }
};

// --- HOOKS DATABASE ---
const setupHooks = (tableName) => {
    db[tableName].hook('creating', (pk, obj) => { 
        const finalId = pk || obj.id;
        if (finalId) syncToCloud(tableName, finalId, obj);
    });
    
    db[tableName].hook('updating', (mods, pk, obj) => { 
        const updatedObj = { ...obj, ...mods };
        syncToCloud(tableName, pk, updatedObj); 
    });
    
    db[tableName].hook('deleting', (pk) => { 
        syncToCloud(tableName, pk, null); 
    });
};

// Pastikan SEMUA tabel masuk ke list sinkronisasi
const allTables = ['products', 'categories', 'transactions', 'members', 'expenses', 'digital_transactions', 'services', 'settings'];
allTables.forEach(setupHooks);

// --- FUNGSI SINKRONISASI MASUK (CLOUD -> LOCAL) ---
const syncFromCloud = () => {
    if (typeof fdb === 'undefined') return;

    allTables.forEach(tableName => {
        const ref = fdb.ref(tableName);
        
        ref.on('child_added', async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                window.isSyncing = true; // Aktifkan flag
                await db[tableName].put(data); 
                window.isSyncing = false; // Matikan flag
            }
        });

        ref.on('child_changed', async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                window.isSyncing = true;
                await db[tableName].put(data);
                window.isSyncing = false;
            }
        });

        ref.on('child_removed', async (snapshot) => {
            const id = snapshot.key;
            const targetId = isNaN(id) ? id : Number(id);
            window.isSyncing = true;
            await db[tableName].delete(targetId);
            window.isSyncing = false;
        });
    });
};

// --- FUNGSI MIGRASI (Tetap Sama) ---
window.fixAllData = async () => {
    if (!confirm("Mulai migrasi ID ke sistem Anti-Tabrakan?")) return;
    const tablesToMigrate = ['products', 'transactions', 'members', 'expenses', 'digital_transactions'];
    for (const table of tablesToMigrate) {
        const items = await db[table].toArray();
        for (const item of items) {
            if (typeof item.id === 'number') {
                const oldId = item.id;
                const newId = window.generateUID();
                const newItem = { ...item, id: newId };
                await db[table].delete(oldId);
                await db[table].add(newItem);
                if (typeof fdb !== 'undefined') fdb.ref(table + '/' + oldId).remove();
            }
        }
    }
    alert("Migrasi Selesai!");
};

// --- HELPER LABA RUGI (Tetap Sama) ---
window.hitungLabaRugi = async (startDate, endDate) => {
    try {
        const semuaTransaksi = await db.transactions.where('date').between(startDate, endDate, true, true).toArray();
        const digitalTrans = await db.digital_transactions.where('date').between(startDate, endDate, true, true).toArray();
        const semuaPengeluaran = await db.expenses.where('date').between(startDate, endDate, true, true).toArray();

        let stats = { totalOmzet: 0, totalModal: 0, totalLabaKotor: 0, totalPengeluaran: 0, totalLabaBersih: 0, count: semuaTransaksi.length + digitalTrans.length };

        semuaTransaksi.forEach(tr => {
            stats.totalOmzet += Number(tr.total || 0);
            if (tr.items) {
                tr.items.forEach(item => {
                    const qty = Number(item.qty || 0);
                    const modal = Number(item.price_modal || 0);
                    const jual = Number(item.price_sell || 0);
                    const extra = Number(item.extraCharge || 0);
                    stats.totalModal += (modal * qty);
                    stats.totalLabaKotor += ((jual - modal) + extra) * qty;
                });
            }
        });

        digitalTrans.forEach(dt => {
            stats.totalLabaKotor += Number(dt.profit || 0);
            stats.totalOmzet += Number(dt.adminFee || 0); 
        });

        semuaPengeluaran.forEach(ex => { stats.totalPengeluaran += Number(ex.amount || 0); });
        stats.totalLabaBersih = stats.totalLabaKotor - stats.totalPengeluaran;
        return stats;
    } catch (err) {
        console.error("Gagal hitung laba:", err);
        return { totalOmzet: 0, totalModal: 0, totalLabaBersih: 0, count: 0 };
    }
};

db.open().then(() => {
    console.log("Database Aktif v18");
    syncFromCloud(); 
}).catch(err => console.error(err));
