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
        'page-dashboard': PageDashboard,
        'struk-nota': StrukNota, 
    },
    
    setup() {
        // --- STATE CLOUD & NAVIGASI ---
        const isCloudOnline = ref(false);
        const isOpen = ref(false);
        const activePage = ref('Penjualan');
        const cart = ref([]); 
        const menuGroupsData = ref([]);
        const storeSettings = ref({ 
            storeName: 'SINAR PAGI', 
            address: 'Jl. Raya No. 1', 
            phone: '08123xxxx' 
        });

        // --- STATE MODAL CUSTOM (PENGGANTI POPUP BROWSER) ---
        const isConfirmModalOpen = ref(false);
        const isSuccessModalOpen = ref(false);

        // --- STATE TRANSAKSI & MEMBER ---
        const payMethod = ref('null');
        const cashAmount = ref(null);
        const lastTransaction = ref(null);
        const isMemberModalOpen = ref(false);
        const selectedMember = ref(null);
        const memberSearchQuery = ref(""); 
        const listMemberDB = ref([]);

        // --- STATE SEARCH ---
        const globalSearchQuery = ref(""); 
        const searchResults = ref([]);    

        // --- INITIALIZATION ---
        const refreshData = async () => {
            menuGroupsData.value = window.menuGroups || [];
            listMemberDB.value = await db.members.toArray();
        };

        onMounted(() => {
            if (typeof fdb !== 'undefined') {
                const connectedRef = firebase.database().ref(".info/connected");
                connectedRef.on("value", (snap) => {
                    isCloudOnline.value = snap.val() === true;
                });
            }
            refreshData();
        });

        watch(isMemberModalOpen, async (newVal) => {
            if (newVal) listMemberDB.value = await db.members.toArray();
        });

        // --- COMPUTED ---
        const filteredMembers = computed(() => {
            const q = memberSearchQuery.value.toLowerCase();
            if (!q) return listMemberDB.value;
            return listMemberDB.value.filter(m => 
                m.name.toLowerCase().includes(q) || m.id.toString().includes(q)
            );
        });

        const totalBayar = computed(() => {
            return cart.value.reduce((sum, item) => sum + (item.price_sell * item.qty), 0);
        });

        // --- LOGIKA PEMBAYARAN BARU (MODAL CUSTOM) ---
        
        // 1. Trigger buka modal konfirmasi
        const prosesBayar = () => {
            if (cart.value.length === 0) return;
            
            if (payMethod.value === 'tempo' && !selectedMember.value) {
                // Untuk error krusial tetap pakai alert sementara agar user sadar
                alert("Pilih Member untuk metode TEMPO!");
                isMemberModalOpen.value = true;
                return;
            }
            isConfirmModalOpen.value = true;
        };

        // 2. Eksekusi simpan data setelah klik "YA" di modal
        const eksekusiBayar = async () => {
            isConfirmModalOpen.value = false;
            
            const total = totalBayar.value;
            let paid = 0;
            let statusBaru = 'lunas';

            if (payMethod.value === 'cash') {
                paid = cashAmount.value ? Number(cashAmount.value) : total;
                statusBaru = 'lunas';
            } else {
                paid = 0; 
                statusBaru = 'hutang';
            }

            try {
                const transData = {
                    date: new Date().toISOString(),
                    total: total,
                    memberId: selectedMember.value ? selectedMember.value.id : null,
                    items: JSON.parse(JSON.stringify(cart.value)),
                    paymentMethod: payMethod.value,
                    amountPaid: paid,
                    change: payMethod.value === 'cash' ? (paid - total > 0 ? paid - total : 0) : 0,
                    status: statusBaru,
                    payments: [],
                    kasir: localStorage.getItem('activeKasir') || 'Pemilik'
                };

                const id = await db.transactions.add(transData);
                lastTransaction.value = { id, ...transData };

                for (const item of cart.value) {
                    const product = await db.products.get(item.id);
                    if (product) await db.products.update(item.id, { qty: product.qty - item.qty });
                }
                
                // Munculkan Modal Berhasil
                isSuccessModalOpen.value = true;
                
                // Reset State Penjualan
                cart.value = []; 
                selectedMember.value = null;
                cashAmount.value = null;
                payMethod.value = 'null';
            } catch (err) {
                alert("Error: " + err.message);
            }
        };

        const cetakStrukTerakhir = () => {
            isSuccessModalOpen.value = false;
            setTimeout(() => { window.print(); }, 500);
        };

        // --- LOGIKA SEARCH & NAV ---
        const handleGlobalSearch = async () => {
            if (!globalSearchQuery.value) { searchResults.value = []; return; }
            const query = globalSearchQuery.value.toLowerCase();
            const allProducts = await db.products.toArray();
            searchResults.value = allProducts.filter(p => 
                (p.name?.toLowerCase().includes(query)) || (p.code?.toLowerCase().includes(query))
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
                'Piutang Penjualan': 'page-piutang-penjualan',
                'Dashboard': 'page-dashboard',
            };
            return map[pageName] || 'page-placeholder';
        };
        
        return {
            isOpen, activePage, cart, totalBayar, prosesBayar, getComponent, selectPage,
            payMethod, cashAmount, lastTransaction, storeSettings, isCloudOnline,
            menuGroups: menuGroupsData, isMemberModalOpen, selectedMember, 
            memberSearchQuery, filteredMembers, globalSearchQuery, searchResults, 
            handleGlobalSearch, addBySearch,
            isConfirmModalOpen, isSuccessModalOpen, eksekusiBayar, cetakStrukTerakhir          
        }
    }
});
app.mount('#app');
