/**
 * MPP Scanner Handler (Final - Direct VueApp Access)
 * Mengelola input dari scanner fisik (HID Mode)
 */

let barcode = '';
let lastKeyTime = Date.now();
let isScanModeActive = true;

// 1. Logika Tombol Toggle UI
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-scan');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isScanModeActive = !isScanModeActive;
            toggleBtn.style.opacity = isScanModeActive ? "1" : "0.5";
            console.log("Scanner Mode:", isScanModeActive ? "Aktif" : "Nonaktif");
        });
    }
});

// 2. Listener Kecepatan Ketik Scanner Fisik
document.addEventListener('keydown', (e) => {
    if (!isScanModeActive) return;

    const activeEl = document.activeElement;
    const isTypingInInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT'
    );

    const currentTime = Date.now();
    
    // Reset jika jeda antar karakter > 50ms (simulasi pengetikan manusia)
    if (currentTime - lastKeyTime > 50) {
        barcode = '';
    }

    if (e.key === 'Enter') {
        if (barcode.length > 0) {
            e.preventDefault(); // Mencegah form submit/reload
            handleScannerInput(barcode.trim());
            barcode = ''; 
        }
    } else {
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            if (!isTypingInInput || (currentTime - lastKeyTime < 30)) {
                barcode += e.key;
            }
        }
    }
    
    lastKeyTime = currentTime;
});

// 3. Routing Input Scanner
async function handleScannerInput(scannedCode) {
    console.log("Barcode Terdeteksi:", scannedCode);

    if (navigator.vibrate) navigator.vibrate(80);

    // Ambil instansi Vue yang di-mount di window.VueApp
    const vueApp = window.VueApp;
    const activePage = vueApp ? vueApp.activePage : '';

    // -------------------------------------------------------------
    // A. JIKA DI HALAMAN "DAFTAR PRODUK"
    // -------------------------------------------------------------
    if (activePage === 'Daftar Produk') {
        if (typeof db !== 'undefined') {
            try {
                const product = await db.products.where('code').equals(scannedCode).first();
                if (product) {
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: product.id }));
                } else {
                    promptTambahProduk(scannedCode, vueApp);
                }
            } catch (err) {
                console.error("Gagal scan di Daftar Produk:", err);
            }
        }
        return;
    } 

    // -------------------------------------------------------------
    // B. JIKA DI HALAMAN "TAMBAH PRODUK"
    // -------------------------------------------------------------
    if (activePage === 'Tambah Produk') {
        isiInputBarcode(scannedCode);
        return;
    }

    // -------------------------------------------------------------
    // C. JIKA DI HALAMAN LAIN (Penjualan, Dashboard, Stock Monitor, dll)
    // -------------------------------------------------------------
    if (typeof db !== 'undefined') {
        try {
            const product = await db.products.where('code').equals(scannedCode).first();
            
            if (product) {
                if (vueApp) {
                    // 1. Pindahkan halaman ke Penjualan jika sedang di luar Penjualan
                    if (vueApp.activePage !== 'Penjualan') {
                        if (typeof vueApp.selectPage === 'function') {
                            vueApp.selectPage('Penjualan');
                        } else {
                            vueApp.activePage = 'Penjualan';
                        }
                    }

                    // 2. Tambahkan ke keranjang belanja
                    setTimeout(() => {
                        if (typeof vueApp.addBySearch === 'function') {
                            vueApp.addBySearch(product);
                        }
                    }, 100);
                }
            } else {
                // PRODUK TIDAK DITEMUKAN -> TAMPILKAN KONFIRMASI
                promptTambahProduk(scannedCode, vueApp);
            }
        } catch (err) {
            console.error("Gagal memproses scanner:", err);
        }
    }
}

// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------

// Helper untuk mengisi kolom barcode pada halaman Tambah Produk
function isiInputBarcode(code) {
    const inputBarcode = document.querySelector('input[placeholder*="Scan atau manual"]');
    if (inputBarcode) {
        inputBarcode.value = code;
        inputBarcode.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// Helper untuk menampilkan dialog konfirmasi jika produk belum ada
function promptTambahProduk(scannedCode, vueApp) {
    const mauTambah = confirm(
        `⚠️ Produk dengan kode "${scannedCode}" belum terdaftar!\n\n` +
        `Apakah Anda ingin menambahkan produk baru dengan kode ini?`
    );

    if (mauTambah && vueApp) {
        // Pindah ke halaman Tambah Produk
        if (typeof vueApp.selectPage === 'function') {
            vueApp.selectPage('Tambah Produk');
        } else {
            vueApp.activePage = 'Tambah Produk';
        }

        // Isikan kode barcode ke input form secara otomatis
        setTimeout(() => {
            isiInputBarcode(scannedCode);
            const inputNama = document.querySelector('input[placeholder*="Indomie"]');
            if (inputNama) inputNama.focus();
        }, 150);
    }
}
