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
        'page-laba-rugi': window.PageLabaRugi, 
        'page-pengeluaran': PagePengeluaran,
        'page-transaksi': PageTransaksi, 
        'page-arus-uang': typeof PageArusUang !== 'undefined' ? PageArusUang : PlaceholderComponent,
        'page-digital-svc': typeof PageDigitalSvc !== 'undefined' ? PageDigitalSvc : PlaceholderComponent,
        'struk-nota': StrukNota, 
    },
    
    setup() {
        const isLoggedIn = ref(false);
        const loginData = ref({ email: '', password: '' });
        const isAuthChecking = ref(true);
        const isCloudOnline = ref(false);
        const isOpen = ref(false);
        const activePage = ref('Penjualan');
        const cart = ref([]); 
        const menuGroupsData = ref([]);
        const storeSettings = ref({ storeName: 'SINAR PAGI', address: 'Jl. Raya No. 1', phone: '08123xxxx' });
        const isScannerOpen = ref(false);
        let html5QrCode = null;

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

        const handleLogin = async () => {
            if (!loginData.value.email || !loginData.value.password) return alert("Isi email dan password!");
            try {
                await firebase.auth().signInWithEmailAndPassword(loginData.value.email, loginData.value.password);
            } catch (err) {
                alert("Gagal Login: " + err.message);
            }
        };

        const handleLogout = () => {
            if (confirm("Keluar dari sistem?")) firebase.auth().signOut();
        };

        onMounted(() => {
            firebase.auth().onAuthStateChanged((user) => {
                isAuthChecking.value = false;
                if (user) {
                    isLoggedIn.value = true;
                    if (typeof fdb !== 'undefined') {
                        fdb.ref(".info/connected").on("value", (snap) => isCloudOnline.value = snap.val() === true);
                    }
                    refreshData();
                } else {
                    isLoggedIn.value = false;
                }
            });
        });

        const startScanner = () => {
            isScannerOpen.value = true;
            setTimeout(() => {
                html5QrCode = new Html5Qrcode("reader");
                html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 15, qrbox: { width: 250, height: 150 } },
                    async (decodedText) => {
                        if (navigator.vibrate) navigator.vibrate(100);
                        
                        // LOGIKA BARU: Kirim ke Daftar Produk (Modal Edit)
                        if (activePage.value === 'Daftar Produk') {
                            window.dispatchEvent(new CustomEvent('barcode-scanned-edit', { detail: decodedText }));
                            stopScanner();
                        } 
                        // LOGIKA SEBELUMNYA: Tambah Produk
                        else if (activePage.value === 'Tambah Produk') {
                            const inputBarcode = document.querySelector('input[placeholder="Scan atau manual..."]');
                            if (inputBarcode) {
                                inputBarcode.value = decodedText;
                                inputBarcode.dispatchEvent(new Event('input', { bubbles: true }));
                                stopScanner();
                            }
                        } 
                        // LOGIKA SEBELUMNYA: Penjualan
                        else {
                            const product = await db.products.where('code').equals(decodedText).first();
                            if (product) {
                                addBySearch(product);
                                stopScanner();
                            } else {
                                alert("Produk tidak ditemukan: " + decodedText);
                                stopScanner();
                            }
                        }
                    }
                ).catch(err => {
                    console.error(err);
                    isScannerOpen.value = false;
                });
            }, 300);
        };

        const stopScanner = () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                    isScannerOpen.value = false;
                });
            } else {
                isScannerOpen.value = false;
            }
        };

        const filteredMembers = computed(() => {
            const q = memberSearchQuery.value.toLowerCase();
            return !q ? listMemberDB.value : listMemberDB.value.filter(m => m.name.toLowerCase().includes(q) || m.id.toString().includes(q));
        });

        const totalBayar = computed(() => cart.value.reduce((sum, item) => sum + (item.price_sell * item.qty), 0));

        const prosesBayar = () => {
            if (cart.value.length === 0) return;
            if (payMethod.value === 'tempo' && !selectedMember.value) {
                alert("Pilih Member!");
                isMemberModalOpen.value = true;
                return;
            }
            isConfirmModalOpen.value = true;
        };

        const eksekusiBayar = async () => {
            isConfirmModalOpen.value = false;
            const total = totalBayar.value;
            let paid = (payMethod.value === 'cash') ? (cashAmount.value ? Number(cashAmount.value) : total) : 0;

            try {
                const transData = {
                    date: new Date().toISOString(),
                    total: total,
                    memberId: selectedMember.value ? selectedMember.value.id : null,
                    items: cart.value.map(i => ({...i})),
                    paymentMethod: payMethod.value,
                    amountPaid: paid,
                    change: (paid > total) ? (paid - total) : 0,
                    status: payMethod.value === 'cash' ? 'lunas' : 'hutang',
                    kasir: 'Admin'
                };

                const id = await db.transactions.add(transData);
                lastTransaction.value = { id, ...transData };

                if (typeof fdb !== 'undefined' && isCloudOnline.value) {
                    await fdb.ref('transactions/' + id).set({ id, ...transData });
                }

                for (const item of cart.value) {
                    const p = await db.products.get(item.id);
                    if (p) {
                        const newQty = p.qty - item.qty;
                        await db.products.update(item.id, { qty: newQty });
                        if (typeof fdb !== 'undefined' && isCloudOnline.value) {
                            await fdb.ref('products/' + item.id).update({ qty: newQty });
                        }
                    }
                }
                
                isSuccessModalOpen.value = true;
                cart.value = []; selectedMember.value = null; cashAmount.value = null; payMethod.value = 'null';
            } catch (err) { alert("Error: " + err.message); }
        };

        const cetakStrukTerakhir = () => {
            isSuccessModalOpen.value = false;
            setTimeout(() => window.print(), 500);
        };

        const handleGlobalSearch = async () => {
            if (!globalSearchQuery.value) { searchResults.value = []; return; }
            const query = globalSearchQuery.value.toLowerCase();
            const all = await db.products.toArray();
            searchResults.value = all.filter(p => (p.name?.toLowerCase().includes(query)) || (p.code?.includes(query))).slice(0, 5); 
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
                'Pengeluaran': 'page-pengeluaran',
                'Riwayat Transaksi': 'page-transaksi', 
                'Arus Uang': 'page-arus-uang',
                'Layanan Digital': 'page-digital-svc' 
            };
            return map[pageName] || 'page-placeholder';
        };
        
        return {
            isLoggedIn, loginData, isAuthChecking, handleLogin, handleLogout,
            isOpen, activePage, cart, totalBayar, prosesBayar, getComponent, selectPage,
            payMethod, cashAmount, lastTransaction, storeSettings, isCloudOnline,
            menuGroups: menuGroupsData, isMemberModalOpen, selectedMember, 
            memberSearchQuery, filteredMembers, globalSearchQuery, searchResults, 
            handleGlobalSearch, addBySearch, isConfirmModalOpen, isSuccessModalOpen, 
            eksekusiBayar, cetakStrukTerakhir, isScannerOpen, startScanner, stopScanner          
        }
    }
});
app.mount('#app');
