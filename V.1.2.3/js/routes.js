// js/routes.js //
window.menuGroups = [
    { 
        title: 'Beranda', 
        items: [
            { name: 'Dashboard', icon: 'ri-dashboard-3-line' },
            { name: 'Penjualan', icon: 'ri-calculator-line' },
            { name: 'Riwayat Transaksi', icon: 'ri-history-line' } // TAMBAHAN: Untuk akses edit & pantau nota
        ]
    },
    { 
        title: 'Operasional', 
        items: [
            { name: 'Stock Monitor', icon: 'ri-radar-line' },
            { name: 'Layanan Digital', icon: 'ri-smartphone-line' },
            { name: 'Piutang Penjualan', icon: 'ri-hand-coin-line' },
            { name: 'Pengeluaran', icon: 'ri-shopping-basket-line' } 
        ]
    },
    { 
        title: 'Master Data', 
        items: [
            { name: 'Daftar Produk', icon: 'ri-list-settings-line' },
            { name: 'Tambah Produk', icon: 'ri-add-box-line' },
            { name: 'Kategori Produk', icon: 'ri-price-tag-3-line' },
            { name: 'Data Member', icon: 'ri-user-heart-line' },
            { name: 'Data Kasir', icon: 'ri-user-star-line' }
        ]
    },
    { 
        title: 'Laporan', 
        items: [
            { name: 'Laporan Harian', icon: 'ri-calendar-event-line' },
            { name: 'Laba Rugi', icon: 'ri-funds-line' },
            { name: 'Arus Uang', icon: 'ri-exchange-funds-line' },
            { name: 'Pengaturan', icon: 'ri-settings-5-line' }
        ]
    }
];
