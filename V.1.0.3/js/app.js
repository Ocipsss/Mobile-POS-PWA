// js/app.js //
// v.1.1.1 //
const { createApp, ref, computed } = Vue;

const app = createApp({
    components: {
        'global-search': GlobalSearchComponent, // Gabungkan barisnya
        'sidebar-nav': SidebarComponent,
        'page-placeholder': PlaceholderComponent,
        'page-penjualan': PagePenjualan,
        'page-tambah-produk': PageTambahProduk,
        'page-kategori': PageKategoriProduk,     
        'page-daftar-produk': PageDaftarProduk,
    },
    
    setup() {
        const isOpen = ref(false);
        const activePage = ref('Penjualan');
        const cart = ref([]); 
        
        // State untuk Member
        const isMemberModalOpen = ref(false);
        const selectedMember = ref(null);

        const selectPage = (name) => {
            activePage.value = name;
            isOpen.value = false;
        };

        const totalBayar = computed(() => {
            return cart.value.reduce((sum, item) => sum + (item.price_sell * item.qty), 0);
        });

        const prosesBayar = async () => {
            if (cart.value.length === 0) return;
            if (confirm(`Proses pembayaran sebesar Rp ${totalBayar.value.toLocaleString('id-ID')}?`)) {
                try {
                    await db.transactions.add({
                        date: new Date().toISOString(),
                        total: totalBayar.value,
                        // Menyimpan data member jika ada
                        member: selectedMember.value ? JSON.parse(JSON.stringify(selectedMember.value)) : null,
                        items: JSON.parse(JSON.stringify(cart.value))
                    });

                    for (const item of cart.value) {
                        const product = await db.products.get(item.id);
                        if (product) {
                            await db.products.update(item.id, {
                                qty: product.qty - item.qty
                            });
                        }
                    }
                    alert("Pembayaran Berhasil & Stok Terupdate!");
                    cart.value = []; 
                    selectedMember.value = null; // Reset member setelah bayar
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
                'Daftar Produk': 'page-daftar-produk'
            };
            return map[pageName] || 'page-placeholder';
        };
        
        // HANYA SATU RETURN DI AKHIR SETUP
        return {
            isOpen,
            activePage,
            menuGroups,
            selectPage,
            cart,
            totalBayar,
            prosesBayar,
            getComponent,
            isMemberModalOpen, // WAJIB ADA DI SINI
            selectedMember     // WAJIB ADA DI SINI
        }
    }
});
// end-b.v.1.1.1

app.mount('#app');

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.error(err));
  });
}
