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
        'page-data-jasa': PageDataJasa,
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
        const listJasaDB = ref([]); 
        const globalSearchQuery = ref(""); 
        const searchResults = ref([]);    

        const refreshData = async () => {
            menuGroupsData.value = window.menuGroups || [];
            listMemberDB.value = await db.members.toArray();
            listJasaDB.value = await db.services.toArray();
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
// start scanner v.1 //
/*
        const startScanner = () => {
            isScannerOpen.value = true;
            setTimeout(() => {
                html5QrCode = new Html5Qrcode("reader");
                html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 15, qrbox: { width: 250, height: 150 } },
                    async (decodedText) => {
                        if (navigator.vibrate) navigator.vibrate(100);
                        
                        if (activePage.value === 'Daftar Produk') {
                            window.dispatchEvent(new CustomEvent('barcode-scanned-edit', { detail: decodedText }));
                            stopScanner();
                        } 
                        else if (activePage.value === 'Tambah Produk') {
                            const inputBarcode = document.querySelector('input[placeholder="Scan atau manual..."]');
                            if (inputBarcode) {
                                inputBarcode.value = decodedText;
                                inputBarcode.dispatchEvent(new Event('input', { bubbles: true }));
                                stopScanner();
                            }
                        } 
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
        */
    // end start-scanner v.1 //
    //////////////////////////
    // startScanner v.2 //
    const startScanner = () => {
    isScannerOpen.value = true;
    setTimeout(() => {
        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
            { facingMode: "environment" },
            { 
                fps: 20, // Meningkatkan FPS agar lebih responsif
                qrbox: { width: 200, height: 120 }, // Kotak lebih kecil memaksa user menjauhkan HP (fokus lebih baik)
                aspectRatio: 1.0
            },
            async (decodedText) => {
                if (navigator.vibrate) navigator.vibrate(100);
                
                // Logika identifikasi halaman tetap sama
                if (activePage.value === 'Daftar Produk') {
                    window.dispatchEvent(new CustomEvent('barcode-scanned-edit', { detail: decodedText }));
                    stopScanner();
                } 
                else if (activePage.value === 'Tambah Produk') {
                    const inputBarcode = document.querySelector('input[placeholder="Scan atau manual..."]');
                    if (inputBarcode) {
                        inputBarcode.value = decodedText;
                        inputBarcode.dispatchEvent(new Event('input', { bubbles: true }));
                        stopScanner();
                    }
                } 
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
        ).then(() => {
            // --- FITUR TAMBAHAN: FLASH & ZOOM ---
            const track = html5QrCode.getRunningTrack();
            const capabilities = track.getCapabilities();

            // 1. Aktifkan Lampu Flash (Jika HP mendukung)
            if (capabilities.torch) {
                track.applyConstraints({
                    advanced: [{ torch: true }]
                }).catch(err => console.warn("Gagal menyalakan flash:", err));
            }

            // 2. Aktifkan Auto Zoom (Untuk membantu jarak 10-15cm)
            // Kita set ke 2x zoom agar user bisa scan dari jarak 25cm (jarak fokus aman)
            // tapi barcode tetap terlihat besar di layar.
            if (capabilities.zoom) {
                const targetZoom = capabilities.zoom.min + 1.5; // Menambah zoom sedikit dari level min
                track.applyConstraints({
                    advanced: [{ zoom: Math.min(targetZoom, capabilities.zoom.max) }]
                }).catch(err => console.warn("Gagal mengatur zoom:", err));
            }
        }).catch(err => {
            console.error(err);
            isScannerOpen.value = false;
        });
    }, 300);
};

    // end-startScanner v.2 //

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

        // UPDATE LOGIKA TOTAL: Menghitung Jasa secara terpisah dari Qty Produk
        const totalBayar = computed(() => {
            return cart.value.reduce((sum, item) => {
                const totalProduk = item.price_sell * item.qty;
                const totalJasa = (item.extraCharge || 0) * (item.extraChargeQty || 0);
                return sum + totalProduk + totalJasa;
            }, 0);
        });

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

        // UPDATE FUNGSI TAMBAH JASA: Memungkinkan kuantitas terpisah
        const tambahJasa = (jasa) => {
            if (cart.value.length === 0) {
                alert("Pilih barangnya dulu (Kopi/Mie)!");
                return;
            }
            const lastIndex = cart.value.length - 1;
            const lastItem = cart.value[lastIndex];

            // Set data jasa ke item terakhir
            lastItem.extraCharge = jasa.price;
            lastItem.extraChargeName = jasa.name;
            // Default 1 jasa, bisa diubah di komponen PagePenjualan menggunakan tombol +/-
            lastItem.extraChargeQty = lastItem.extraChargeQty || 1; 
            
            if (!lastItem.name.includes("(Seduh)")) {
                lastItem.name = lastItem.name + " (Seduh)";
            }

            if (navigator.vibrate) navigator.vibrate(50);
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
            if (activePage.value === 'Daftar Produk') {
                window.dispatchEvent(new CustomEvent('open-product-detail', { detail: product }));
                globalSearchQuery.value = ""; searchResults.value = [];
                return;
            }
            
            const inCart = cart.value.find(item => item.id === product.id);
            // Inisialisasi extraChargeQty ke 0 untuk produk baru
            inCart ? inCart.qty++ : cart.value.push({ ...product, qty: 1, extraCharge: 0, extraChargeQty: 0 });
            globalSearchQuery.value = ""; searchResults.value = [];
        };

        const selectPage = (name) => { 
            isOpen.value = false; 
            activePage.value = name; 
            refreshData();
        };
        
        const getComponent = (pageName) => {
            const map = {
                'Penjualan': 'page-penjualan', 
                'Tambah Produk': 'page-tambah-produk',
                'Kategori Produk': 'page-kategori', 
                'Daftar Produk': 'page-daftar-produk',
                'Data Member': 'page-data-member', 
                'Data Jasa': 'page-data-jasa',
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
            eksekusiBayar, cetakStrukTerakhir, isScannerOpen, startScanner, stopScanner,
            tambahJasa, listJasaDB, refreshData          
        }
    }
});
app.mount('#app');
