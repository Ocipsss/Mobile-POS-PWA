/* js/routes.js */
/**
 * DATA KONFIGURASI MENU
 * Berisi daftar kategori dan item menu yang tampil di sidebar.
 * Dipisahkan agar file utama app.js tetap bersih.
 */
window.menuGroups = [
    { 
        title: 'Operasional', 
        items: [
            { name: 'Penjualan', icon: 'ri-calculator-line' },
            { name: 'Stock Monitor', icon: 'ri-radar-line' }
        ]
    },
    { 
        title: 'Master Produk', 
        items: [
            { name: 'Daftar Produk', icon: 'ri-list-settings-line' },
            { name: 'Tambah Produk', icon: 'ri-add-box-line' },
            { name: 'Kategori Produk', icon: 'ri-price-tag-3-line' },
            { name: 'Paket Produk', icon: 'ri-stack-line' }
        ]
    },
    { 
        title: 'Master Harga', 
        items: [
            { name: 'Harga Grosir', icon: 'ri-coupon-2-line' },
            { name: 'Harga Paket', icon: 'ri-gift-line' }
        ]
    },
    { 
        title: 'Master Data', 
        items: [
            { name: 'Data Kasir', icon: 'ri-user-star-line' },
            { name: 'Data Member', icon: 'ri-user-heart-line' },
            { name: 'Data Supplier', icon: 'ri-truck-line' }
        ]
    },
    { 
        title: 'Laporan Penjualan', 
        items: [
            { name: 'Laporan Harian', icon: 'ri-calendar-event-line' },
            { name: 'Laporan Mingguan', icon: 'ri-calendar-2-line' },
            { name: 'Laporan Bulanan', icon: 'ri-calendar-todo-line' },
            { name: 'Laba Bersih/Rugi', icon: 'ri-funds-line' }
        ]
    },
    { 
        title: 'Laporan Keuangan', 
        items: [
            { name: 'Arus Uang', icon: 'ri-exchange-funds-line' },
            { name: 'Pemasukan', icon: 'ri-arrow-left-down-line' },
            { name: 'Pengeluaran', icon: 'ri-arrow-right-up-line' },
            { name: 'Total Saldo', icon: 'ri-bank-card-line' },
            { name: 'Piutang Penjualan', icon: 'ri-hand-coin-line' }
        ]
    },
    { 
        title: 'Sistem', 
        items: [
            { name: 'Pengaturan', icon: 'ri-settings-5-line' }
        ] 
    }
];
