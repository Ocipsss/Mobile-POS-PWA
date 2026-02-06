const StrukNota = {
    props: ['transaksi', 'settings', 'printerCharacteristic'],
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

        // Helper untuk format waktu agar seragam di template & bluetooth
        const getDateTime = (dateSource) => {
            const d = new Date(dateSource);
            // Jika dateSource tidak valid, gunakan waktu sekarang
            const validDate = isNaN(d.getTime()) ? new Date() : d;
            
            return {
                date: validDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                time: validDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            };
        };

        // --- FUNGSI CETAK BLUETOOTH (ESC/POS) ---
        const printBluetooth = async (data) => {
            if (!props.printerCharacteristic) return false;

            try {
                const encoder = new EscPosEncoder();
                const dt = getDateTime(data.date);

                let result = encoder
                    .initialize()
                    .align('center')
                    .line(localSettings.value.storeName.toUpperCase())
                    .line(localSettings.value.address)
                    .line(localSettings.value.phone)
                    .line('-'.repeat(32))
                    .align('left')
                    .line(`Nota : #${data.id.toString().slice(-5)}`)
                    .line(`Tgl  : ${dt.date} ${dt.time}`)
                    .line('-'.repeat(32));

                data.items.forEach(item => {
                    result.line(item.name.toUpperCase());
                    const detail = `${item.qty}x${getFinalPrice(item).toLocaleString('id-ID')}`;
                    const subtotal = (item.qty * getFinalPrice(item)).toLocaleString('id-ID');
                    result.line(detail.padEnd(20) + subtotal.padStart(12));
                });

                result.line('-'.repeat(32))
                    .align('right')
                    .line(`TOTAL:   ${data.total.toLocaleString('id-ID').padStart(12)}`);

                if (data.paymentMethod === 'cash') {
                    result.line(`BAYAR:   ${(data.amountPaid || 0).toLocaleString('id-ID').padStart(12)}`)
                          .line(`KEMBALI: ${(data.change || 0).toLocaleString('id-ID').padStart(12)}`);
                } else {
                    result.line(`METODE:  ${(data.paymentMethod || 'NON-TUNAI').toUpperCase().padStart(12)}`);
                }

                result.align('center')
                    .newline()
                    .line(localSettings.value.footerNote)
                    .newline();
                
                if (reprintData.value) {
                    result.line("** SALINAN NOTA **").newline();
                }

                result.newline()
                    .cut();

                const fullData = result.encode();
                const chunkSize = 20; 
                
                for (let i = 0; i < fullData.length; i += chunkSize) {
                    const chunk = fullData.slice(i, i + chunkSize);
                    if (props.printerCharacteristic.properties.writeWithoutResponse) {
                        await props.printerCharacteristic.writeValueWithoutResponse(chunk);
                    } else {
                        await props.printerCharacteristic.writeValue(chunk);
                    }
                    await new Promise(resolve => setTimeout(resolve, 30));
                }

                return true;
            } catch (err) {
                console.error("Gagal kirim data Bluetooth:", err);
                return false;
            }
        };

        const prepareAndPrint = async (data) => {
            reprintData.value = data;
            const isBtSuccess = await printBluetooth(data);
            if (!isBtSuccess) {
                await Vue.nextTick();
                setTimeout(() => {
                    try {
                        window.print();
                    } catch (e) {
                        alert("Gagal memanggil fungsi cetak: " + e.message);
                    }
                }, 500);
            }
            setTimeout(() => {
                reprintData.value = null;
            }, 3000);
        };

        Vue.onMounted(() => {
            window.addEventListener('print-struk', (event) => {
                if (event.detail) prepareAndPrint(event.detail);
            });
        });

        return { localSettings, getFinalPrice, currentData, reprintData, getDateTime };
    },
    template: `
    <div id="print-section" class="print-only">
        <div v-if="currentData" class="struk-wrapper" style="width: 52mm; margin: 0 auto; font-family: 'Courier New', monospace; color: #000; padding: 10px;">
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="font-size: 16px; font-weight: bold; text-transform: uppercase;">{{ localSettings.storeName }}</div>
                <div style="font-size: 10px;">{{ localSettings.address }}</div>
                <div style="font-size: 10px;">{{ localSettings.phone }}</div>
            </div>
            
            <div style="text-align: center;">-------------------------------</div>
            
            <div style="font-size: 10px; margin: 5px 0;">
                <div style="display: flex; justify-content: space-between;">
                    <span>#{{ currentData.id.toString().slice(-5) }}</span>
                    <span>{{ getDateTime(currentData.date).date }}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Kasir: {{ currentData.kasir || 'Admin' }}</span>
                    <span>{{ getDateTime(currentData.date).time }}</span>
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
                <div v-if="reprintData" style="font-weight: bold; margin-top: 5px;">** HATUR NUHUN **</div>
            </div>
        </div>
    </div>
    `
};
