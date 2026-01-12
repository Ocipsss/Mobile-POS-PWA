// components/pages/StrukNota.js //

const StrukNota = {
    props: ['transaksi', 'settings'],
    setup(props) {
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

        const currentData = Vue.computed(() => {
            return reprintData.value || props.transaksi;
        });

        const getFinalPrice = (item) => {
            return item.price_sell + (item.extraCharge || 0);
        };

        const handlePrint = async (data) => {
            console.log("Memulai proses cetak ulang...");
            reprintData.value = data;
            
            // Tunggu render DOM selesai
            await Vue.nextTick();
            
            // Jeda 500ms untuk memastikan sinkronisasi browser
            setTimeout(() => {
                window.print();
                // Bersihkan data setelah print selesai
                setTimeout(() => {
                    reprintData.value = null;
                }, 2000);
            }, 500);
        };

        Vue.onMounted(() => {
            console.log("StrukNota terpasang, mendengarkan sinyal printer...");
            window.addEventListener('print-struk', (event) => {
                handlePrint(event.detail);
            });
        });

        return { localSettings, getFinalPrice, currentData, reprintData };
    },
    template: `
    <div id="print-section" class="print-only">
        
        <div v-if="currentData" class="struk-wrapper">
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
