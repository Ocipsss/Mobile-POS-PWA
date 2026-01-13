const StrukNota = {
    props: ['transaksi', 'settings'],
    setup(props) {
        const reprintData = Vue.ref(null);

        const localSettings = Vue.computed(() => {
            const saved = localStorage.getItem('sinar_pagi_settings');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { console.error(e); }
            }
            return props.settings || {
                storeName: 'SINAR PAGI',
                address: 'Jl. Raya No. 1',
                phone: '08123xxxx',
                footerNote: 'Terima Kasih'
            };
        });

        const currentData = Vue.computed(() => reprintData.value || props.transaksi);

        const getFinalPrice = (item) => {
            return (Number(item.price_sell) || 0) + (Number(item.extraCharge) || 0);
        };

        const prepareAndPrint = async (data) => {
            console.log("Memproses Struk...");
            reprintData.value = data;
            
            // Tunggu DOM selesai dibuat oleh Vue
            await Vue.nextTick();
            
            // Jeda tambahan 500ms untuk memastikan font dan layout stabil di mobile
            setTimeout(() => {
                try {
                    window.print();
                } catch (e) {
                    alert("Gagal memanggil fungsi cetak: " + e.message);
                }
                
                // Bersihkan data setelah dialog print muncul (jeda 2 detik)
                setTimeout(() => {
                    reprintData.value = null;
                }, 2000);
            }, 500);
        };

        Vue.onMounted(() => {
            window.addEventListener('print-struk', (event) => {
                if (event.detail) prepareAndPrint(event.detail);
            });
        });

        return { localSettings, getFinalPrice, currentData, reprintData };
    },
    template: `
    <div id="print-section" class="print-only">
        <div v-if="currentData" class="struk-wrapper" style="width: 52mm; margin: 0 auto; font-family: 'Courier New', monospace; color: #000;">
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 16px; font-weight: bold; text-transform: uppercase;">{{ localSettings.storeName }}</div>
                <div style="font-size: 10px;">{{ localSettings.address }}</div>
                <div style="font-size: 10px;">{{ localSettings.phone }}</div>
            </div>
            
            <div style="text-align: center;">-------------------------------</div>
            
            <div style="font-size: 10px; margin: 5px 0;">
                <div style="display: flex; justify-content: space-between;">
                    <span>#{{ currentData.id.toString().slice(-5) }}</span>
                    <span>{{ new Date(currentData.date).toLocaleDateString('id-ID') }}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Kasir: {{ currentData.kasir || 'Admin' }}</span>
                    <span>{{ new Date(currentData.date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) }}</span>
                </div>
            </div>

            <div style="text-align: center;">-------------------------------</div>

            <div style="margin: 5px 0;">
                <div v-for="(item, index) in currentData.items" :key="index" style="margin-bottom: 6px;">
                    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase;">{{ item.name }}</div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px;">
                        <span>{{ item.qty }} x {{ getFinalPrice(item).toLocaleString('id-ID') }}</span>
                        <span>{{ (item.qty * getFinalPrice(item)).toLocaleString('id-ID') }}</span>
                    </div>
                </div>
            </div>

            <div style="text-align: center;">-------------------------------</div>

            <div style="font-size: 12px; font-weight: bold;">
                <div style="display: flex; justify-content: space-between;">
                    <span>TOTAL</span>
                    <span>{{ (currentData.total || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div v-if="currentData.paymentMethod === 'cash'" style="display: flex; justify-content: space-between;">
                    <span>BAYAR</span>
                    <span>{{ (currentData.amountPaid || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div v-if="currentData.paymentMethod === 'cash'" style="display: flex; justify-content: space-between;">
                    <span>KEMBALI</span>
                    <span>{{ (currentData.change || 0).toLocaleString('id-ID') }}</span>
                </div>
                <div v-else style="display: flex; justify-content: space-between;">
                    <span>METODE</span>
                    <span style="text-transform: uppercase;">{{ currentData.paymentMethod }}</span>
                </div>
            </div>

            <div style="text-align: center; margin-top: 5px;">-------------------------------</div>
            
            <div style="text-align: center; font-size: 9px; margin-top: 5px;">
                <div>{{ localSettings.footerNote }}</div>
                <div v-if="reprintData" style="font-weight: bold; margin-top: 5px;">** SALINAN NOTA **</div>
            </div>
        </div>
    </div>
    `
};
