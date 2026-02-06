// js/database.js
const db = new Dexie("SinarPagiDB");

window.generateUID = () => {
    return 'SP-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
};

// Update ke versi 19 untuk mendukung tabel product_packages
db.version(19).stores({
    products: 'id, name, code, category, price_modal, price_sell, qty, unit',
    product_packages: 'id, productId, name, qty_pcs, price_sell', 
    categories: '++id, name', 
    transactions: 'id, date, total, memberId, paymentMethod, amountPaid, change, status',
    members: 'id, name, phone, address, total_spending, points', 
    expenses: 'id, date, category, amount, note, paymentMethod, cashPart, qrisPart',
    digital_transactions: 'id, date, type, provider, nominal, adminFee, adminPaymentMethod, totalReceived, profit',
    settings: 'id, storeName',
    services: '++id, name, price' 
});

window.isSyncing = false;

// --- SINKRONISASI CLOUD ---
const syncToCloud = (table, id, data) => {
    if (window.isSyncing) return;
    if (typeof fdb !== 'undefined' && id) {
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

// Tambahkan product_packages ke daftar sinkronisasi
const allTables = ['products', 'product_packages', 'categories', 'transactions', 'members', 'expenses', 'digital_transactions', 'services', 'settings'];
allTables.forEach(setupHooks);

const syncFromCloud = () => {
    if (typeof fdb === 'undefined') return;
    allTables.forEach(tableName => {
        const ref = fdb.ref(tableName);
        ref.on('child_added', async (snapshot) => {
            const data = snapshot.val();
            if (data) { window.isSyncing = true; await db[tableName].put(data); window.isSyncing = false; }
        });
        ref.on('child_changed', async (snapshot) => {
            const data = snapshot.val();
            if (data) { window.isSyncing = true; await db[tableName].put(data); window.isSyncing = false; }
        });
        ref.on('child_removed', async (snapshot) => {
            const id = snapshot.key;
            const targetId = isNaN(id) ? id : Number(id);
            window.isSyncing = true; await db[tableName].delete(targetId); window.isSyncing = false;
        });
    });
};

// --- MIGRASI ID ---
window.fixAllData = async () => {
    if (!confirm("Mulai migrasi ID ke sistem Anti-Tabrakan?")) return;
    const tablesToMigrate = ['products', 'product_packages', 'transactions', 'members', 'expenses', 'digital_transactions'];
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

// --- HITUNG LABA RUGI (Dukungan Eceran) ---
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
                    const qtyJual = Number(item.qty || 0);
                    const qtyReduce = Number(item.qty_reduce || 1); // Rasio eceran (misal 1/12)
                    const modalSatuanUtama = Number(item.price_modal || 0);
                    
                    // Modal yang dihitung adalah (Modal 1 Bungkus * Rasio * Qty Jual)
                    const modalTerpakai = modalSatuanUtama * qtyReduce * qtyJual;
                    const hargaJualTotal = Number(item.price_sell || 0) * qtyJual;
                    const extra = (Number(item.extraCharge || 0) * Number(item.extraChargeQty || 0));

                    stats.totalModal += modalTerpakai;
                    stats.totalLabaKotor += (hargaJualTotal - modalTerpakai) + extra;
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
    console.log("Database Aktif v19");
    syncFromCloud(); 
}).catch(err => console.error(err));
