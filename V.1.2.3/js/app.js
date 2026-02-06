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
        'page-harga-paket': typeof PageHargaPaket !== 'undefined' ? PageHargaPaket : PlaceholderComponent,
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

        // --- STATE HARGA PAKET (PENAMBAHAN BARU) ---
        const isPackageModalOpen = ref(false);
        const packageOptions = ref([]);
        const pendingProduct = ref(null);

        // --- STATE BLUETOOTH PRINTER ---
        const printerCharacteristic = ref(null);
        const isPrinterConnected = ref(false);

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

        // --- FUNGSI KONEKSI PRINTER ---
        const connectPrinter = async () => {
            try {
                const device = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: [
                        "0000ff00-0000-1000-8000-00805f9b34fb",
                        "0000ae30-0000-1000-8000-00805f9b34fb",
                        "49535343-fe7d-4ae5-8fa9-9fafd205e455"
                    ]
                });

                const server = await device.gatt.connect();
                
                let service;
                try {
                    service = await server.getPrimaryService("0000ff00-0000-1000-8000-00805f9b34fb");
                } catch (e) {
                    const services = await server.getPrimaryServices();
                    service = services[0];
                }

                const characteristics = await service.getCharacteristics();
                const writeChar = characteristics.find(c => 
                    c.properties.write || c.properties.writeWithoutResponse
                );

                if (writeChar) {
                    printerCharacteristic.value = writeChar;
                    isPrinterConnected.value = true;
                    alert("VSC Printer Terhubung!");
                } else {
                    alert("Karakteristik printer tidak ditemukan.");
                }
            } catch (error) {
                alert("Koneksi Gagal: " + error.message);
            }
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

        // startScanner v.2 //
        const startScanner = () => {
            isScannerOpen.value = true;
            if (html5QrCode) {
                html5QrCode.clear();
            }

            setTimeout(() => {
                html5QrCode = new Html5Qrcode("reader");
                const config = { 
                    fps: 20, 
                    qrbox: { width: 250, height: 150 },
                    videoConstraints: {
                        facingMode: "environment",
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 }
                    }
                };

                html5QrCode.start(
                    { facingMode: "environment" },
                    config,
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
                ).then(() => {
                    try {
                        const track = html5QrCode.getRunningTrack();
                        if (track) {
                            const capabilities = track.getCapabilities();
                            const constraints = { advanced: [] };

                            if (capabilities.torch) {
                                constraints.advanced.push({ torch: true });
                            }

                            if (capabilities.zoom) {
                                const zoomValue = Math.min(capabilities.zoom.min + 1, capabilities.zoom.max);
                                constraints.advanced.push({ zoom: zoomValue });
                            }

                            if (constraints.advanced.length > 0) {
                                track.applyConstraints(constraints).catch(e => console.log("Constraint error:", e));
                            }
                        }
                    } catch (err) {
                        console.warn("Fitur hardware tidak didukung browser:", err);
                    }
                }).catch(err => {
                    console.error("Gagal buka kamera:", err);
                    alert("Kamera gagal terbuka. Pastikan izin kamera diberikan.");
                    isScannerOpen.value = false;
                });
            }, 500);
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
        // 1. Tambahkan ID transaksi manual (sangat penting untuk Dexie)
        const transactionId = Date.now().toString();

        const transData = {
            id: transactionId, // Kunci utama transaksi
            date: new Date().toLocaleString('sv-SE'),
            total: total,
            memberId: selectedMember.value ? selectedMember.value.id : null,
            // Perbaikan: Pastikan item keranjang bersih dari nilai 'undefined'
            items: cart.value.map(i => {
                const itemClean = {...i};
                // Pastikan qty_reduce ada harganya, kalau tidak ada anggap 1
                if (!itemClean.qty_reduce) itemClean.qty_reduce = 1;
                return itemClean;
            }),
            paymentMethod: payMethod.value,
            amountPaid: paid,
            change: (paid > total) ? (paid - total) : 0,
            status: payMethod.value === 'cash' ? 'lunas' : 'hutang',
            kasir: 'Admin'
        };

        // 2. Simpan Transaksi
        const id = await db.transactions.add(transData);
        lastTransaction.value = { id, ...transData };

        if (typeof fdb !== 'undefined' && isCloudOnline.value) {
            await fdb.ref('transactions/' + id).set(transData);
        }

        // 3. Update Stok (Gunakan logika Batang)
        for (const item of transData.items) {
            const p = await db.products.get(item.id);
            if (p) {
                const stokSekarang = Number(p.stock || p.qty || 0);
                // Pengurangan: Qty Beli x Isi per paket
                const totalPotong = Number(item.qty) * Number(item.qty_reduce || 1);
                const stokBaru = stokSekarang - totalPotong;

                await db.products.update(item.id, { 
                    stock: stokBaru,
                    qty: stokBaru 
                });

                if (typeof fdb !== 'undefined' && isCloudOnline.value) {
                    await fdb.ref('products/' + item.id).update({ 
                        qty: stokBaru,
                        stock: stokBaru 
                    });
                }
            }
        }
        
        isSuccessModalOpen.value = true;
        cart.value = []; selectedMember.value = null; cashAmount.value = null; payMethod.value = 'null';
    } catch (err) { 
        console.error("Error Detail:", err);
        alert("Gagal Transaksi: " + err.message); 
    }
};


        const tambahJasa = (jasa) => {
            if (cart.value.length === 0) {
                alert("Pilih barangnya dulu (Kopi/Mie)!");
                return;
            }
            const lastIndex = cart.value.length - 1;
            const lastItem = cart.value[lastIndex];

            lastItem.extraCharge = jasa.price;
            lastItem.extraChargeName = jasa.name;
            lastItem.extraChargeQty = lastItem.extraChargeQty || 1; 
            
            if (!lastItem.name.includes("(Seduh)")) {
                lastItem.name = lastItem.name + " (Seduh)";
            }

            if (navigator.vibrate) navigator.vibrate(50);
        };

        const cetakStrukTerakhir = () => {
            isSuccessModalOpen.value = false;
            if (lastTransaction.value) {
                window.dispatchEvent(new CustomEvent('print-struk', { 
                    detail: JSON.parse(JSON.stringify(lastTransaction.value)) 
                }));
            }
        };

        const handleGlobalSearch = async () => {
            if (!globalSearchQuery.value) { searchResults.value = []; return; }
            const query = globalSearchQuery.value.toLowerCase();
            const all = await db.products.toArray();
            searchResults.value = all.filter(p => (p.name?.toLowerCase().includes(query)) || (p.code?.includes(query))).slice(0, 5); 
        };

        // --- LOGIKA ADD BY SEARCH DENGAN FILTER ROKOK & PAKET ---
        const addBySearch = async (product) => {
            if (activePage.value === 'Daftar Produk') {
                window.dispatchEvent(new CustomEvent('open-product-detail', { detail: product.id }));
                globalSearchQuery.value = ""; 
                searchResults.value = [];
                return;
            }
            
            // Cek Kategori Rokok (Case Insensitive)
            const isRokok = product.category && product.category.toLowerCase() === 'rokok';
            
            // Ambil data paket jika ada
            const packages = isRokok ? await db.product_packages.where('productId').equals(product.id).toArray() : [];

            if (isRokok && packages.length > 0) {
                pendingProduct.value = product;
                packageOptions.value = [
                    { id: 'base', name: product.unit, price_sell: product.price_sell, qty_pcs: 1 },
    ...packages
                ];
                isPackageModalOpen.value = true;
            } else {
                addToCartFinal(product, product.price_sell, 1, product.unit);
            }

            globalSearchQuery.value = ""; 
            searchResults.value = [];
        };

        const selectPackage = (pkg) => {
            addToCartFinal(pendingProduct.value, pkg.price_sell, pkg.qty_pcs, pkg.name);
            isPackageModalOpen.value = false;
        };

        const addToCartFinal = (product, price, qtyToReduce, displayName) => {
            // Gunakan cartId unik (ID Produk + Label Paket)
            const cartId = product.id + (displayName !== product.unit ? '-' + displayName : '');
            const inCart = cart.value.find(item => item.cartId === cartId);

            if (inCart) {
                inCart.qty++;
            } else {
                cart.value.push({ 
                    ...product, 
                    cartId: cartId,
                    name: displayName === product.unit ? product.name : `${product.name} ${displayName}`,
                    price_sell: price,
                    qty: 1, 
                    qty_reduce: qtyToReduce, 
                    extraCharge: 0, 
                    extraChargeQty: 0 
                });
            }

            if (navigator.vibrate) navigator.vibrate(50);
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
                'Harga Paket': 'page-harga-paket',
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
            tambahJasa, listJasaDB, refreshData,
            printerCharacteristic, isPrinterConnected, connectPrinter,
            isPackageModalOpen, packageOptions, selectPackage, pendingProduct
        }
    }
});
app.mount('#app');
