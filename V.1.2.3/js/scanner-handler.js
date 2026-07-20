/**
 * MPP Scanner Handler (Fixed for Sinar Pagi POS)
 * Mengelola input dari scanner fisik (HID Mode)
 */

let barcode = '';
let lastKeyTime = Date.now();
let isScanModeActive = true;

// 1. Toggle Button Handler
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

// 2. Listener Kecepatan Ketik Scanner
document.addEventListener('keydown', (e) => {
    if (!isScanModeActive) return;

    // Abaikan jika user sedang fokus mengetik manual di input/textarea
    const activeEl = document.activeElement;
    const isTypingInInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT'
    );

    const currentTime = Date.now();
    
    // Reset jika jeda antar karakter > 50ms (karakter manusia)
    if (currentTime - lastKeyTime > 50) {
        barcode = '';
    }

    if (e.key === 'Enter') {
        if (barcode.length > 0) {
            e.preventDefault(); // Mencegah submit form bawaan browser
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

    const activePage = window.VueApp ? window.VueApp.activePage : '';

    // -------------------------------------------------------------
    // A. JIKA DI HALAMAN "DAFTAR PRODUK"
    // -------------------------------------------------------------
    if (activePage === 'Daftar Produk') {
        if (typeof db !== 'undefined') {
            try {
                // Cari produk berdasarkan KODE BARCODE
                const product = await db.products.where('code').equals(scannedCode).first();
                if (product) {
                    // Kirim ID produk ke listener DaftarProduk.js
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: product.id }));
                } else {
                    alert(`⚠️ Produk dengan barcode "${scannedCode}" tidak ditemukan di daftar!`);
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
        const inputBarcode = document.querySelector('input[placeholder*="Scan atau manual"]');
        if (inputBarcode) {
            inputBarcode.value = scannedCode;
            inputBarcode.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
    }

    // -------------------------------------------------------------
    // C. JIKA DI HALAMAN "PENJUALAN" / KASIR (DEFAULT)
    // -------------------------------------------------------------
    if (typeof db !== 'undefined') {
        try {
            const product = await db.products.where('code').equals(scannedCode).first();
            if (product) {
                if (window.VueApp && typeof window.VueApp.addBySearch === 'function') {
                    window.VueApp.addBySearch(product);
                }
            } else {
                alert(`⚠️ Produk dengan kode "${scannedCode}" tidak ditemukan!`);
            }
        } catch (err) {
            console.error("Gagal memproses scanner:", err);
        }
    }
}
