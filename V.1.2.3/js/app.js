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
        // Menggunakan window. untuk memastikan variabel dari file eksternal terbaca
        'page-laba-rugi': window.PageLabaRugi, 
        'struk-nota': StrukNota, 
    },
    
    setup() {
        const isCloudOnline = ref(false);
        const isOpen = ref(false);
        const activePage = ref('Penjualan');
        const cart = ref([]); 
        const menuGroupsData = ref([]);
        const storeSettings = ref({ storeName: 'SINAR PAGI', address: 'Jl. Raya No. 1', phone: '08123xxxx' });

        const isConfirmModalOpen = ref(false);
        const isSuccessModalOpen = ref(false);
        const payMethod = ref('null');
        const cashAmount = ref(null);
        const lastTransaction = ref(null);
        
        const isMemberModalOpen = ref(false);
        const selectedMember = ref(null);
        const memberSearchQuery = ref(""); 
        const listMemberDB = ref([]);
        const globalSearchQuery = ref(""); 
        const searchResults = ref([]);    

        const refreshData = async () => {
            menuGroupsData.value = window.menuGroups || [];
            listMemberDB.value = await db.members.toArray();
        };

        onMounted(() => {
            if (typeof fdb !== 'undefined') {
                fdb.ref(".info/connected").on("value", (snap) => {
                    isCloudOnline.value = snap.val() === true;
                });
            }
            refreshData();
        });

        watch(isMemberModalOpen, async (val) => { if (val) listMemberDB.value = await db.members.toArray(); });

        const filteredMembers = computed(() => {
            const q = memberSearchQuery.value.toLowerCase();
            return q ? listMemberDB.value.filter(m => m.name.toLowerCase().includes(q) || m.id.toString().includes(q)) : listMemberDB.value;
        });

        const totalBayar = computed(() => cart.value.reduce((sum, item) => sum + (item.price_sell * item.qty), 0));

        const prosesBayar = () => {
            if (cart.value.length === 0) return;
            if (payMethod.value === 'tempo' && !selectedMember.value) {
                alert("Pilih Member untuk metode TEMPO!");
                isMemberModalOpen.value = true;
                return;
            }
            isConfirmModalOpen.value = true;
        };

        const eksekusiBayar = async () => {
            isConfirmModalOpen.value = false;
            const total = totalBayar.value;
            let paid = (payMethod.value === 'cash') ? (cashAmount.value ? Number(cashAmount.value) : total) : 0;
            let statusBaru = payMethod.value === 'cash' ? 'lunas' : 'hutang';

            try {
                const mappedItems = cart.value.map(item => {
                    const modal = Number(item.price_modal || 0);
                    const jual = Number(item.price_sell || 0);
                    return {
                        id: item.id,
                        name: item.name,
                        qty: item.qty,
                        price_modal: modal,
                        price_sell: jual,
                        profit: (jual - modal) * item.qty
                    };
                });

                const transData = {
                    date: new Date().toISOString(),
                    total: total,
                    memberId: selectedMember.value ? selectedMember.value.id : null,
                    items: mappedItems,
                    paymentMethod: payMethod.value,
                    amountPaid: paid,
                    change: (payMethod.value === 'cash' && paid > total) ? (paid - total) : 0,
                    status: statusBaru,
                    payments: [],
                    kasir: localStorage.getItem('activeKasir') || 'Pemilik'
                };

                const id = await db.transactions.add(transData);
                lastTransaction.value = { id, ...transData };

                for (const item of cart.value) {
                    const p = await db.products.get(item.id);
                    if (p) await db.products.update(item.id, { qty: p.qty - item.qty });
                }
                
                isSuccessModalOpen.value = true;
                cart.value = []; selectedMember.value = null; cashAmount.value = null; payMethod.value = 'null';
            } catch (err) { alert("Error: " + err.message); }
        };

        const cetakStrukTerakhir = () => {
            isSuccessModalOpen.value = false;
            setTimeout(() => { window.print(); }, 500);
        };

        const handleGlobalSearch = async () => {
            if (!globalSearchQuery.value) { searchResults.value = []; return; }
            const query = globalSearchQuery.value.toLowerCase();
            const all = await db.products.toArray();
            searchResults.value = all.filter(p => p.name?.toLowerCase().includes(query) || p.code?.toLowerCase().includes(query)).slice(0, 5); 
        };

        const addBySearch = (product) => {
            const inCart = cart.value.find(item => item.id === product.id);
            inCart ? inCart.qty++ : cart.value.push({ ...product, qty: 1 });
            globalSearchQuery.value = ""; searchResults.value = [];
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
                'Laba Rugi': 'page-laba-rugi',
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
