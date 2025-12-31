// js/database.js //

const db = new Dexie("SinarPagiDB");

// Versi 8 - Pastikan index 'date' ada untuk pencarian Laba Rugi
db.version(8).stores({
    products: '++id, name, code, category, price_modal, price_sell, qty, unit',
    categories: '++id, name',
    transactions: '++id, date, total, memberId, paymentMethod, amountPaid, change, status', // Ditambahkan index date
    members: '++id, name, phone, address',
    settings: 'id, storeName'
});

// Fungsi Sinkronisasi Cloud dengan proteksi error
const syncToCloud = (table, id, data) => {
    if (typeof fdb !== 'undefined' && id !== undefined) {
        try {
            const ref = fdb.ref(table + '/' + id);
            if (data === null) {
                ref.remove();
            } else {
                // Gunakan JSON.parse(JSON.stringify) untuk membersihkan prototype Dexie
                ref.set(JSON.parse(JSON.stringify(data)));
            }
        } catch (e) {
            console.warn("Cloud Sync Failed:", e.message);
        }
    }
};

// --- HOOKS DATABASE ---

db.products.hook('creating', (pk, obj) => { syncToCloud('products', pk || obj.id, obj); });
db.products.hook('updating', (mods, pk, obj) => { syncToCloud('products', pk, obj); });
db.products.hook('deleting', (pk) => { syncToCloud('products', pk, null); });

db.members.hook('creating', (pk, obj) => { syncToCloud('members', pk || obj.id, obj); });
db.members.hook('updating', (mods, pk, obj) => { syncToCloud('members', pk, obj); });
db.members.hook('deleting', (pk) => { syncToCloud('members', pk, null); });

db.transactions.hook('creating', (pk, obj) => { syncToCloud('transactions', pk || obj.id, obj); });
db.transactions.hook('updating', (mods, pk, obj) => {
    // Gunakan timeout sedikit agar data selesai diupdate di IndexedDB sebelum dikirim ke Cloud
    setTimeout(() => {
        db.transactions.get(pk).then(updated => {
            if (updated) syncToCloud('transactions', pk, updated);
        });
    }, 100);
});
db.transactions.hook('deleting', (pk) => { syncToCloud('transactions', pk, null); });

db.open().catch(err => console.error("DB Error:", err));

// --- HELPER LABA RUGI (REVISI LOGIKA) ---

window.hitungLabaRugi = async (startDate, endDate) => {
    try {
        // .between(start, end, includeStart, includeEnd)
        // Pastikan startDate dan endDate berupa string ISO: "2023-10-01"
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
                    const modalSatuan = Number(item.price_modal || 0);
                    const jualSatuan = Number(item.price_sell || 0);

                    // 1. Hitung total modal untuk transaksi ini
                    stats.totalModal += (modalSatuan * qty);

                    // 2. Hitung Laba Bersih
                    // Jika ada item.profit (transaksi baru), pakai itu. 
                    // Jika tidak (transaksi lama), hitung manual: (jual - modal) * qty
                    if (typeof item.profit !== 'undefined') {
                        stats.totalLabaBersih += Number(item.profit);
                    } else {
                        stats.totalLabaBersih += (jualSatuan - modalSatuan) * qty;
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
