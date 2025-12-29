// js/app.js //
// v.1.2.0 - Relasi memberId & Pencatatan Transaksi Pelanggan //
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
        'page-data-member': PageDataMember 
    },
    
    setup() {
        const isOpen = ref(false);
        const activePage = ref('Penjualan');
        const cart = ref([]); 
        
        const menuGroupsData = ref([]);

        // --- STATE MEMBER ---
        const isMemberModalOpen = ref(false);
        const selectedMember = ref(null);
        const memberSearchQuery = ref(""); 
        const listMemberDB = ref([]); // Data asli dari Dexie

        // --- STATE SEARCH PRODUK ---
        const globalSearchQuery = ref(""); 
        const searchResults = ref([]);    

        // Fungsi Load Data Awal
        const refreshData = async () => {
            menuGroupsData.value = window.menuGroups || (typeof menuGroups !== 'undefined' ? menuGroups : []);
            // Tarik data member terbaru setiap kali aplikasi atau modal dibuka
            listMemberDB.value = await db.members.toArray();
            // Di dalam setup() app.js:

const prosesBayar = async (paymentData) => {
    if (cart.value.length === 0) return;
    
    try {
        const transactionPayload = {
            date: new Date().toISOString(),
            total: totalBayar.value,
            memberId: selectedMember.value ? selectedMember.value.id : null,
            items: JSON.parse(JSON.stringify(cart.value)),
            paymentMethod: paymentData.method,
            amountPaid: paymentData.method === 'cash' ? paymentData.paid : totalBayar.value,
            change: paymentData.method === 'cash' ? paymentData.change : 0,
            status: paymentData.method === 'tempo' ? 'hutang' : 'lunas'
        };

        await db.transactions.add(transactionPayload);

        // Update stok produk
        for (const item of cart.value) {
            const product = await db.products.get(item.id);
            if (product) {
                await db.products.update(item.id, { 
                    qty: product.qty - item.qty 
                });
            }
        }
        
        alert(`Transaksi ${paymentData.method.toUpperCase()} Berhasil!`);
        cart.value = []; 
        selectedMember.value = null;
    } catch (err) {
        console.error(err);
        alert("Gagal memproses transaksi");
    }
};

// Pastikan di template index.html pada bagian <component :is="getComponent(activePage)">
// Ditambahkan listener:
// <component :is="getComponent(activePage)" :cart="cart" :selected-member="selectedMember" @checkout="prosesBayar">

        };

        onMounted(refreshData);

        // Pantau saat modal member dibuka, segarkan data dari database
        watch(isMemberModalOpen, async (newVal) => {
            if (newVal) {
                listMemberDB.value = await db.members.toArray();
            }
        });

        // Filter member di modal berdasarkan input (Nama atau ID)
        const filteredMembers = computed(() => {
            const q = memberSearchQuery.value.toLowerCase();
            if (!q) return listMemberDB.value;
            return listMemberDB.value.filter(m => 
                m.name.toLowerCase().includes(q) || 
                m.id.toString().includes(q) ||
                (m.phone && m.phone.includes(q))
            );
        });

        // Fungsi mencari produk untuk Header
        const handleGlobalSearch = async () => {
            if (!globalSearchQuery.value) {
                searchResults.value = [];
                return;
            }
            const query = globalSearchQuery.value.toLowerCase();
            try {
                const allProducts = await db.products.toArray();
                searchResults.value = allProducts.filter(p => 
                    (p.name && p.name.toLowerCase().includes(query)) || 
                    (p.code && p.code.toLowerCase().includes(query))
                ).slice(0, 5); 
            } catch (err) {
                console.error("Gagal cari produk:", err);
            }
        };

        const addBySearch = (product) => {
            const itemInCart = cart.value.find(item => item.id === product.id);
            if (itemInCart) {
                itemInCart.qty++;
            } else {
                cart.value.push({ ...product, qty: 1 });
            }
            globalSearchQuery.value = "";
            searchResults.value = [];
        };

        const selectPage = (name) => {
            activePage.value = name;
            isOpen.value = false;
        };

        const totalBayar = computed(() => {
            return cart.value.reduce((sum, item) => sum + (item.price_sell * item.qty), 0);
        });

        const prosesBayar = async () => {
            if (cart.value.length === 0) return;
            
            const konfirmasi = confirm(`Total: Rp ${totalBayar.value.toLocaleString('id-ID')}\nLanjutkan pembayaran?`);
            
            if (konfirmasi) {
                try {
                    await db.transactions.add({
                        date: new Date().toISOString(),
                        total: totalBayar.value,
                        // MEREKAM ID MEMBER (Relasi ke tabel members)
                        memberId: selectedMember.value ? selectedMember.value.id : null,
                        items: JSON.parse(JSON.stringify(cart.value))
                    });

                    // Update stok produk
                    for (const item of cart.value) {
                        const product = await db.products.get(item.id);
                        if (product) {
                            await db.products.update(item.id, { 
                                qty: product.qty - item.qty 
                            });
                        }
                    }
                    
                    alert("Pembayaran Berhasil!");
                    cart.value = []; 
                    selectedMember.value = null; // Reset member setelah transaksi
                } catch (err) {
                    console.error(err);
                    alert("Gagal memproses transaksi");
                }
            }
        };
        
        const getComponent = (pageName) => {
            const map = {
                'Penjualan': 'page-penjualan',
                'Tambah Produk': 'page-tambah-produk',
                'Kategori Produk': 'page-kategori',
                'Daftar Produk': 'page-daftar-produk',
                'Data Member': 'page-data-member'
            };
            return map[pageName] || 'page-placeholder';
        };
        
        return {
            isOpen, activePage, cart, totalBayar, prosesBayar, getComponent, selectPage,
            menuGroups: menuGroupsData,
            isMemberModalOpen, selectedMember, memberSearchQuery, filteredMembers,
            globalSearchQuery, searchResults, handleGlobalSearch, addBySearch          
        }
    }
});

app.mount('#app');