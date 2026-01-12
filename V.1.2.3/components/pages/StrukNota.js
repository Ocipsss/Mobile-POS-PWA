// components/pages/StrukNota.js //

const StrukNota = {
    props: ['transaksi', 'settings'],
    setup(props) {
        // State internal untuk menangani data reprint
        const reprintData = Vue.ref(null);

        const localSettings = Vue.computed(() => {
            const saved = localStorage.getItem('sinar_pagi_settings');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Format settings rusak:", e);
                }
            }
            return props.settings || {
                storeName: 'SINAR PAGI',
                address: 'Alamat Belum Diatur',
                phone: '',
                footerNote: 'Terima Kasih Atas Kunjungan Anda'
            };
        });

        // Tentukan data yang aktif secara reaktif
        const currentData = Vue.computed(() => {
            return reprintData.value || props.transaksi;
        });

        const getFinalPrice = (item) => {
            return (item.price_sell || 0) + (item.extraCharge || 0);
        };

        // FUNGSI INTI: Memastikan data ter-render sebelum diprint
       const prepareAndPrint = async (data) => {
    console.log("Menyiapkan data struk...", data);
    
    // 1. Masukkan data
    reprintData.value = data;
    
    // 2. Tunggu Vue selesai mengupdate DOM
    await Vue.nextTick();
    
    // 3. Jeda 800ms (Kritikal untuk PDF/Mobile agar tidak kosong)
    setTimeout(() => {
        window.print();
        
        // 4. Bersihkan data setelah 1.5 detik (setelah dialog print muncul)
        setTimeout(() => {
            reprintData.value = null;
        }, 1500);
    }, 800); 
};


        Vue.onMounted(() => {
            console.log("StrukNota Listener: Aktif");
            window.addEventListener('print-struk', (event) => {
                prepareAndPrint(event.detail);
            });
        });

        return { localSettings, getFinalPrice, currentData, reprintData };
    },
    template: `
    <div id="print-section" class="print-only">
        <div v-if="currentData" :key="currentData.id" class="struk-wrapper">
            <div class="struk-header">
                <h2 class="store-name" style="font-size: 16px; font-weight: bold; text-align: center; margin: 0;">{{ localSettings.storeName }}</h2>
                <p class="store-address" style="font-size: 10px; text-align: center; margin: 0;">{{ localSettings.address }}</p>
                <p class="store-phone" v-if="localSettings.phone" style="font-size: 10px; text-align: center; margin: 0;">{{ localSettings.phone }}</p>
            </div>
            
            <div class="struk-divider" style="text-align: center; margin: 5px 0;">--------------------------------</div>
            
            <div class="struk-info" style="font-size: 10px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between;">
                    <span>No: #{{ currentData.id.toString().slice(-5) }}</span>
                    <span>{{ new Date(currentData.date).toLocaleDateString('id-ID') }}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Kasir: {{ currentData.kasir || 'Admin' }}</span>
                    <span>{{ new Date(currentData.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) }}</span>
                </div>
            </div>

            <div class="struk-divider" style="text-align: center; margin: 5px 0;">--------------------------------</div>

            <div class="struk-items">
                <div v-for="(item, index) in currentData.items" :key="index" style="margin-bottom: 8px;">
                    <div class="item-name" style="font-size: 11px; font-weight: bold; text-transform: uppercase;">{{ item.name }}</div>
                    <div class="item-details" style="display: flex; justify-content: space-between; font-size: 11px;">
                        <span>{{ item.qty }} x {{ getFinalPrice(item).toLocaleString('id-ID') }}</span>
                        <span>{{ (item.qty * getFinalPrice(item)).toLocaleString('id-ID') }}</span>
                    </div>
                </div>
            </div>

            <div class="struk-divider" style="text-align: center; margin: 5px 0;">--------------------------------</div>

            <div class="struk-total" style="font-size: 12px; font-weight: bold;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>TOTAL</span>
                    <span>Rp {{ (currentData.total || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div v-if="currentData.paymentMethod === 'cash'" style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span>BAYAR</span>
                    <span>Rp {{ (currentData.amountPaid || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div v-if="currentData.paymentMethod === 'cash'" style="display: flex; justify-content: space-between;">
                    <span>KEMBALI</span>
                    <span>Rp {{ (currentData.change || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div v-else style="display: flex; justify-content: space-between;">
                    <span>METODE</span>
                    <span style="text-transform: uppercase;">{{ currentData.paymentMethod }}</span>
                </div>
            </div>

            <div class="struk-divider" style="text-align: center; margin: 5px 0;">--------------------------------</div>
            
            <div class="struk-footer" style="text-align: center; font-size: 10px; margin-top: 10px;">
                <p style="margin: 0;">{{ localSettings.footerNote }}</p>
                <p style="font-size: 8px; margin-top: 4px;">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
                <p v-if="reprintData" style="font-size: 8px; margin-top: 5px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px;">
                    ** SALINAN NOTA (REPRINT) **
                </p>
            </div>
        </div>
    </div>
    `
};
