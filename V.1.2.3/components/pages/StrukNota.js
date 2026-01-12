const StrukNota = {
    props: ['transaksi', 'settings'],
    setup(props) {
        // State tambahan untuk menampung data reprint
        const reprintData = Vue.ref(null);

        const localSettings = Vue.computed(() => {
            const saved = localStorage.getItem('sinar_pagi_settings');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { console.error(e); }
            }
            return props.settings || {
                storeName: 'SINAR PAGI',
                address: 'Alamat Belum Diatur',
                phone: '',
                footerNote: 'Terima Kasih Atas Kunjungan Anda'
            };
        });

        // Computed property untuk menentukan data mana yang akan ditampilkan
        // Jika ada data reprint, gunakan itu. Jika tidak, gunakan props transaksi.
        const currentData = Vue.computed(() => {
            return reprintData.value || props.transaksi;
        });

        const getFinalPrice = (item) => {
            return item.price_sell + (item.extraCharge || 0);
        };

        // Logika menangkap event reprint
        Vue.onMounted(() => {
            window.addEventListener('print-struk', (event) => {
                reprintData.value = event.detail;
                
                // Beri waktu sedikit agar DOM terupdate dengan data baru, lalu cetak
                Vue.nextTick(() => {
                    window.print();
                    
                    // Opsional: Reset kembali setelah print selesai agar tidak nyangkut
                    setTimeout(() => {
                        reprintData.value = null;
                    }, 1000);
                });
            });
        });

        return { localSettings, getFinalPrice, currentData };
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
                <p v-if="currentData" style="font-size: 7px; margin-top: 2dp; color: #888;">** CETAK ULANG **</p>
            </div>
        </div>
    </div>
    `
};
