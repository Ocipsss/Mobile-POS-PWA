// components/pages/StrukNota.js //
const StrukNota = {
    props: ['transaksi', 'settings'],
    setup(props) {
        // Ambil pengaturan dari localStorage atau fallback ke props
        const localSettings = Vue.computed(() => {
            const saved = localStorage.getItem('sinar_pagi_settings');
            return saved ? JSON.parse(saved) : (props.settings || {});
        });

        return { localSettings };
    },
    template: `
    <div id="print-section" class="print-only">
        <div class="struk-wrapper">
            <div class="struk-header">
                <h2 class="store-name">{{ localSettings.storeName || 'SINAR PAGI' }}</h2>
                <p class="store-address">{{ localSettings.address || 'Alamat Belum Diatur' }}</p>
                <p class="store-phone">{{ localSettings.phone || '' }}</p>
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
                <p>{{ localSettings.footerNote || 'Terima Kasih Atas Kunjungan Anda' }}</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            </div>
        </div>
    </div>
    `
};
