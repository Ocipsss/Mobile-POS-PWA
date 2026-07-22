/**
 * MPP Scanner Handler (Fixed for Sinar Pagi POS)
 */

let barcode = '';
let lastKeyTime = Date.now();
let isScanModeActive = true;

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-scan');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isScanModeActive = !isScanModeActive;
            toggleBtn.style.opacity = isScanModeActive ? "1" : "0.5";
        });
    }
});

document.addEventListener('keydown', (e) => {
    if (!isScanModeActive) return;

    const activeEl = document.activeElement;
    const isTypingInInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT'
    );

    const currentTime = Date.now();
    
    if (currentTime - lastKeyTime > 50) {
        barcode = '';
    }

    if (e.key === 'Enter') {
        if (barcode.length > 0) {
            e.preventDefault();
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
                // Cari produk berdasarkan KODE BARCODE di IndexedDB
                const product = await db.products.where('code').equals(scannedCode).first();
                
                if (product) {
                    // Kirimkan Event dengan ID Produk
                    window.dispatchEvent(new CustomEvent('open-product-detail', { 
                        detail: product.id 
                    }));
                } else {
                    alert(`⚠️ Produk dengan barcode "${scannedCode}" tidak ditemukan!`);
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
    // C. JIKA DI HALAMAN "PENJUALAN" / KASIR
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
