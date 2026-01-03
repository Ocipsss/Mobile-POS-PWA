// components/pages/StrukNota.js //
const StrukNota = {
    props: ['transaksi', 'settings'],
    setup(props) {
        /**
         * Logic:
         * Mengambil pengaturan dari localStorage sebagai sumber utama.
         * Data ini sudah terupdate otomatis dari Firebase saat user membuka tab Pengaturan.
         */
        const localSettings = Vue.computed(() => {
            const saved = localStorage.getItem('sinar_pagi_settings');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Format settings rusak:", e);
                }
            }
            // Fallback jika localStorage kosong
            return props.settings || {
                storeName: 'SINAR PAGI',
                address: 'Alamat Belum Diatur',
                phone: '',
                footerNote: 'Terima Kasih Atas Kunjungan Anda'
            };
        });

        return { localSettings };
    },
    template: `
    <div id="print-section" class="print-only">
        <div class="struk-wrapper">
            <div class="struk-header">
                <h2 class="store-name">{{ localSettings.storeName }}</h2>
                <p class="store-address">{{ localSettings.address }}</p>
                <p class="store-phone" v-if="localSettings.phone">{{ localSettings.phone }}</p>
            </div>
            
            <div class="struk-divider">--------------------------------</div>
            
            <div class="struk-info">
                <span>No: #{{ transaksi.id }}</span>
                <span class="text-right">{{ new Date(transaksi.date).toLocaleDateString('id-ID') }}</span>
                <span>Kasir: {{ transaksi.kasir || 'Admin' }}</span>
                <span class="text-right">{{ new Date(transaksi.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) }}</span>
            </div>

            <div class="struk-divider">--------------------------------</div>

            <div class="struk-items">
                <div v-for="item in transaksi.items" :key="item.id" class="item-row">
                    <div class="item-name">{{ item.name.toUpperCase() }}</div>
                    <div class="item-details">
                        <span>{{ item.qty }} x {{ item.price_sell.toLocaleString('id-ID') }}</span>
                        <span class="text-right">{{ (item.qty * item.price_sell).toLocaleString('id-ID') }}</span>
                    </div>
                </div>
            </div>

            <div class="struk-divider">--------------------------------</div>

            <div class="struk-total">
                <div class="total-row">
                    <span>TOTAL</span>
                    <span class="text-right">Rp {{ transaksi.total.toLocaleString('id-ID') }}</span>
                </div>
                <div class="total-row" v-if="transaksi.paymentMethod === 'cash'">
                    <span>BAYAR</span>
                    <span class="text-right">Rp {{ (transaksi.amountPaid || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div class="total-row" v-if="transaksi.paymentMethod === 'cash'" style="font-weight: bold;">
                    <span>KEMBALI</span>
                    <span class="text-right">Rp {{ (transaksi.change || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div class="total-row" v-else>
                    <span>METODE</span>
                    <span class="text-right uppercase">{{ transaksi.paymentMethod }}</span>
                </div>
            </div>

            <div class="struk-divider">--------------------------------</div>
            
            <div class="struk-footer">
                <p>{{ localSettings.footerNote }}</p>
                <p style="font-size: 8px; margin-top: 4px;">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            </div>
        </div>
    </div>
    `
};
