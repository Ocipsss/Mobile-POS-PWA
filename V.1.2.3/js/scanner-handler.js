/**
 * MPP Scanner Handler (Optimized for Sinar Pagi POS)
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

// 2. Listener Utama Tangkap Kecepatan Ketik Scanner Fisik
document.addEventListener('keydown', (e) => {
    if (!isScanModeActive) return;

    // Abaikan jika pengguna sedang mengetik biasa di dalam form input/textarea/select
    const activeEl = document.activeElement;
    const isTypingInInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT'
    );

    const currentTime = Date.now();
    
    // Kecepatan scanner biasanya < 30ms-50ms per karakter
    if (currentTime - lastKeyTime > 50) {
        barcode = '';
    }

    if (e.key === 'Enter') {
        if (barcode.length > 0) {
            // Mencegah aksi submit bawaan browser/form
            e.preventDefault();
            
            handleScannerInput(barcode.trim());
            barcode = ''; // Reset buffer
        }
    } else {
        // Hanya rekam karakter tunggal & abaikan tombol navigasi/modifier (Shift, Ctrl, Alt)
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // Jika sedang mengetik biasa di input form, jangan potong alurnya
            if (!isTypingInInput || (currentTime - lastKeyTime < 30)) {
                barcode += e.key;
            }
        }
    }
    
    lastKeyTime = currentTime;
});

// 3. Routing Input Scanner ke Sistem Sinar Pagi POS
async function handleScannerInput(scannedCode) {
    console.log("Barcode Terdeteksi:", scannedCode);

    if (navigator.vibrate) navigator.vibrate(80); // Feedback getar jika di mobile/tablet

    // A. Jika di Halaman "Daftar Produk" -> Kirim Event Edit Produk
    const activePage = window.VueApp ? window.VueApp.activePage : '';
    
    if (activePage === 'Daftar Produk') {
        window.dispatchEvent(new CustomEvent('barcode-scanned-edit', { detail: scannedCode }));
        return;
    } 

    // B. Jika di Halaman "Tambah Produk" -> Isikan ke Field Barcode Form
    if (activePage === 'Tambah Produk') {
        const inputBarcode = document.querySelector('input[placeholder*="Scan atau manual"]');
        if (inputBarcode) {
            inputBarcode.value = scannedCode;
            inputBarcode.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
    }

    // C. Default (Di Halaman Penjualan / Kasir): Cari produk & Masukkan ke Keranjang
    if (typeof db !== 'undefined') {
        try {
            const product = await db.products.where('code').equals(scannedCode).first();
            if (product) {
                // Memanggil fungsi addBySearch() milik Instance App Vue
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
