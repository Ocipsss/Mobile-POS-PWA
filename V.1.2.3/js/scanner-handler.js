/**
 * MPP Scanner Handler (Final - Retry DOM & Reliable Auto-Fill)
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
        isiInputBarcodeWithRetry(scannedCode);
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
                    // Pindahkan halaman ke Penjualan jika sedang di luar Penjualan
                    if (vueApp.activePage !== 'Penjualan') {
                        if (typeof vueApp.selectPage === 'function') {
                            vueApp.selectPage('Penjualan');
                        } else {
                            vueApp.activePage = 'Penjualan';
                        }
                    }

                    // Tambahkan ke keranjang belanja
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

// Helper dengan mekanisme "Retry": terus mencari elemen input sampai DOM siap
function isiInputBarcodeWithRetry(code, attempts = 0) {
    const inputBarcode = document.querySelector('input[placeholder*="Scan atau manual"]');
    
    if (inputBarcode) {
        // Gunakan setter bawaan agar V-Model Vue mendeteksi perubahan nilai secara otomatis
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(inputBarcode, code);

        inputBarcode.dispatchEvent(new Event('input', { bubbles: true }));
        inputBarcode.dispatchEvent(new Event('change', { bubbles: true }));

        // Fokus ke input Nama Produk jika ada
        const inputNama = document.querySelector('input[placeholder*="Indomie"]') || document.querySelector('input[v-model="product.name"]');
        if (inputNama) inputNama.focus();

        console.log("Kode berhasil ditempelkan:", code);
    } else if (attempts < 10) {
        // Jika elemen belum siap, coba lagi setiap 50ms (maksimal 10x percobaan)
        setTimeout(() => isiInputBarcodeWithRetry(code, attempts + 1), 50);
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

        // Panggil fungsi pencari elemen dengan pola Retry
        isiInputBarcodeWithRetry(scannedCode);
    }
}
