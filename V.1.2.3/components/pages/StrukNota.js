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

        // Tentukan data yang aktif: data reprint diutamakan, jika kosong gunakan props transaksi
        const currentData = Vue.computed(() => {
            return reprintData.value || props.transaksi;
        });

        const getFinalPrice = (item) => {
            return item.price_sell + (item.extraCharge || 0);
        };

        // Pasang listener untuk menangkap event 'print-struk' dari Riwayat Transaksi
        Vue.onMounted(() => {
            window.addEventListener('print-struk', async (event) => {
                console.log("Menerima data reprint:", event.detail);
                
                // 1. Set data ke state reaktif
                reprintData.value = event.detail;
                
                // 2. Beri jeda agar Vue memperbarui DOM dengan data transaksi baru
                await Vue.nextTick();
                
                // 3. Beri sedikit jeda tambahan (500ms) untuk memastikan render selesai sepenuhnya
                setTimeout(() => {
                    window.print();
                    
                    // 4. Setelah dialog print muncul/selesai, bersihkan data reprint
                    setTimeout(() => {
                        reprintData.value = null;
                    }, 1000);
                }, 500);
            });
        });

        return { localSettings, getFinalPrice, currentData, reprintData };
    },
    template: `
    <div v-if="currentData" id="print-section" class="print-only">
        <div class="struk-wrapper">
            <div class="struk-header">
                <h2 class="store-name">{{ localSettings.storeName }}</h2>
                <p class="store-address">{{ localSettings.address }}</p>
                <p class="store-phone" v-if="localSettings.phone">{{ localSettings.phone }}</p>
            </div>
            
            <div class="struk-divider">--------------------------------</div>
            
            <div class="struk-info">
                <span>No: #{{ currentData.id.toString().slice(-5) }}</span>
                <span class="text-right">{{ new Date(currentData.date).toLocaleDateString('id-ID') }}</span>
                <span>Kasir: {{ currentData.kasir || 'Admin' }}</span>
                <span class="text-right">{{ new Date(currentData.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) }}</span>
            </div>

            <div class="struk-divider">--------------------------------</div>

            <div class="struk-items">
                <div v-for="item in currentData.items" :key="item.id" class="item-row">
                    <div class="item-name">{{ item.name.toUpperCase() }}</div>
                    <div class="item-details">
                        <span>{{ item.qty }} x {{ getFinalPrice(item).toLocaleString('id-ID') }}</span>
                        <span class="text-right">{{ (item.qty * getFinalPrice(item)).toLocaleString('id-ID') }}</span>
                    </div>
                </div>
            </div>

            <div class="struk-divider">--------------------------------</div>

            <div class="struk-total">
                <div class="total-row">
                    <span>TOTAL</span>
                    <span class="text-right">Rp {{ currentData.total.toLocaleString('id-ID') }}</span>
                </div>
                <div class="total-row" v-if="currentData.paymentMethod === 'cash'">
                    <span>BAYAR</span>
                    <span class="text-right">Rp {{ (currentData.amountPaid || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div class="total-row" v-if="currentData.paymentMethod === 'cash'" style="font-weight: bold;">
                    <span>KEMBALI</span>
                    <span class="text-right">Rp {{ (currentData.change || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div class="total-row" v-else>
                    <span>METODE</span>
                    <span class="text-right uppercase">{{ currentData.paymentMethod }}</span>
                </div>
            </div>

            <div class="struk-divider">--------------------------------</div>
            
            <div class="struk-footer">
                <p>{{ localSettings.footerNote }}</p>
                <p style="font-size: 8px; margin-top: 4px;">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
                <p v-if="reprintData" style="font-size: 8px; margin-top: 5px; font-weight: bold; border-top: 1px dashed #ccc; padding-top: 3px;">
                    ** SALINAN NOTA (REPRINT) **
                </p>
            </div>
        </div>
    </div>
    `
};
