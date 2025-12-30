const { createApp, ref, computed, onMounted, watch } = Vue;

const app = createApp({
    components: {
        'global-search': GlobalSearchComponent,
        'sidebar-nav': SidebarComponent,
        'page-placeholder': PlaceholderComponent,
        'page-penjualan': PagePenjualan,
        'page-tambah-produk': PageTambahProduk,
        'page-kategori': PageKategoriProduk,     
        'page-daftar-produk': PageDaftarProduk,
        'page-data-member': PageDataMember,
        'page-pengaturan': PagePengaturan,
        'page-laporan-harian': PageLaporanHarian,
        'page-stock-monitor': PageStockMonitor,
        'page-piutang-penjualan': PagePiutangPenjualan,
        'page-dashboard':
        PageDashboard,
        'struk-nota': StrukNota, // Pastikan variabel StrukNota tersedia (panggil file-nya di index.html)
    },
    
    setup() {
        // --- STATE NAVIGASI & DATA ---
        const isOpen = ref(false);
        const activePage = ref('Penjualan');
        const cart = ref([]); 
        const menuGroupsData = ref([]);
        const storeSettings = ref({ 
            storeName: 'SINAR PAGI', 
            address: 'Jl. Raya No. 1', 
            phone: '08123xxxx' 
        });

        // --- STATE PEMBAYARAN & STRUK ---
        const payMethod = ref('null');
        const cashAmount = ref(null);
        const lastTransaction = ref(null); // Menyimpan data untuk struk

        // --- STATE MEMBER ---
        const isMemberModalOpen = ref(false);
        const selectedMember = ref(null);
        const memberSearchQuery = ref(""); 
        const listMemberDB = ref([]);

        // --- STATE SEARCH PRODUK ---
        const globalSearchQuery = ref(""); 
        const searchResults = ref([]);    

        // --- LOGIKA DATA ---
        const refreshData = async () => {
            menuGroupsData.value = window.menuGroups || [];
            listMemberDB.value = await db.members.toArray();
        };

        onMounted(refreshData);

        watch(isMemberModalOpen, async (newVal) => {
            if (newVal) listMemberDB.value = await db.members.toArray();
        });

        const filteredMembers = computed(() => {
            const q = memberSearchQuery.value.toLowerCase();
            if (!q) return listMemberDB.value;
            return listMemberDB.value.filter(m => 
                m.name.toLowerCase().includes(q) || 
                m.id.toString().includes(q)
            );
        });

        const totalBayar = computed(() => {
            return cart.value.reduce((sum, item) => sum + (item.price_sell * item.qty), 0);
        });

        // --- FUNGSI PROSES BAYAR (VERSI GABUNGAN) ---
        const prosesBayar = async () => {
            if (cart.value.length === 0) return;

            if (payMethod.value === 'tempo' && !selectedMember.value) {
                alert("Harap pilih Member terlebih dahulu untuk metode TEMPO!");
                isMemberModalOpen.value = true;
                return;
            }

            const total = totalBayar.value;
            const paid = (payMethod.value === 'cash' && cashAmount.value) ? Number(cashAmount.value) : total;
            const change = (paid - total) > 0 ? (paid - total) : 0;

            const konfirmasi = confirm(`Total: Rp ${total.toLocaleString('id-ID')}\nMetode: ${payMethod.value.toUpperCase()}\nLanjutkan & Cetak Struk?`);
            
            if (konfirmasi) {
                try {
                    const transData = {
                        date: new Date().toISOString(),
                        total: total,
                        memberId: selectedMember.value ? selectedMember.value.id : null,
                        items: JSON.parse(JSON.stringify(cart.value)),
                        paymentMethod: payMethod.value,
                        amountPaid: paid,
                        change: payMethod.value === 'cash' ? change : 0,
                        status: payMethod.value === 'tempo' ? 'hutang' : 'lunas',
                        kasir: localStorage.getItem('activeKasir') || 'Pemilik'
                    };

                    const id = await db.transactions.add(transData);
                    
                    // Simpan ke state untuk memicu munculnya komponen <struk-nota>
                    lastTransaction.value = { id, ...transData };

                    // Update stok
                    for (const item of cart.value) {
                        const product = await db.products.get(item.id);
                        if (product) {
                            await db.products.update(item.id, { qty: product.qty - item.qty });
                        }
                    }
                    
                    // Delay sedikit agar Vue sempat merender struk sebelum jendela print muncul
                    setTimeout(() => {
                        window.print();
                    }, 500);

                    alert("Pembayaran Berhasil!");
                    
                    // Reset State
                    cart.value = []; 
                    selectedMember.value = null;
                    cashAmount.value = null;
                    payMethod.value = 'null';
                } catch (err) {
                    console.error(err);
                    alert("Gagal simpan transaksi");
                }
            }
        };

        // --- LOGIKA SEARCH & NAV ---
        const handleGlobalSearch = async () => {
            if (!globalSearchQuery.value) { searchResults.value = []; return; }
            const query = globalSearchQuery.value.toLowerCase();
            const allProducts = await db.products.toArray();
            searchResults.value = allProducts.filter(p => 
                (p.name && p.name.toLowerCase().includes(query)) || (p.code && p.code.toLowerCase().includes(query))
            ).slice(0, 5); 
        };

        const addBySearch = (product) => {
            const itemInCart = cart.value.find(item => item.id === product.id);
            itemInCart ? itemInCart.qty++ : cart.value.push({ ...product, qty: 1 });
            globalSearchQuery.value = "";
            searchResults.value = [];
        };

        const selectPage = (name) => { isOpen.value = false; activePage.value = name; };
        
        const getComponent = (pageName) => {
            const map = {
                'Penjualan': 'page-penjualan',
                'Tambah Produk': 'page-tambah-produk',
                'Kategori Produk': 'page-kategori',
                'Daftar Produk': 'page-daftar-produk',
                'Data Member': 'page-data-member',
                'Pengaturan': 'page-pengaturan',
                'Laporan Harian': 'page-laporan-harian',
                'Stock Monitor': 'page-stock-monitor',
                'Piutang Penjualan':
                'page-piutang-penjualan',
                'Dashboard':
                'page-dashboard',
            };
            return map[pageName] || 'page-placeholder';
        };
        
        return {
            isOpen, activePage, cart, totalBayar, prosesBayar, getComponent, selectPage,
            payMethod, cashAmount, lastTransaction, storeSettings, // Penting untuk Struk
            menuGroups: menuGroupsData,
            isMemberModalOpen, selectedMember, memberSearchQuery, filteredMembers,
            globalSearchQuery, searchResults, handleGlobalSearch, addBySearch          
        }
    }
});

app.mount('#app');
