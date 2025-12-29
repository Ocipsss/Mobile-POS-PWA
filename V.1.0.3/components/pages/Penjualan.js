const PagePenjualan = {
    props: ['cart', 'selectedMember'], 
    emits: ['checkout'],
    setup(props, { emit }) {
        const payMethod = Vue.ref('cash');
        const cashAmount = Vue.ref(0);
        
        const totalBelanja = Vue.computed(() => {
            return props.cart.reduce((sum, item) => sum + (item.price_sell * item.qty), 0);
        });

        const kembalian = Vue.computed(() => {
            const change = cashAmount.value - totalBelanja.value;
            return change > 0 ? change : 0;
        });

        const submitOrder = () => {
            if (payMethod.value === 'cash' && cashAmount.value < totalBelanja.value) {
                alert("Uang tunai tidak mencukupi!");
                return;
            }
            if (payMethod.value === 'tempo' && !props.selectedMember) {
                alert("Metode TEMPO wajib memilih Pelanggan/Member terlebih dahulu!");
                return;
            }

            emit('checkout', {
                method: payMethod.value,
                paid: cashAmount.value,
                change: kembalian.value
            });
            
            // Reset local state
            cashAmount.value = 0;
        };

        const formatRupiah = (val) => "Rp " + (val || 0).toLocaleString('id-ID');

        return { payMethod, cashAmount, totalBelanja, kembalian, submitOrder, formatRupiah };
    },
    template: `
        <div class="flex flex-col gap-4 pb-32">
            <div v-for="item in cart" :key="item.id" class="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div class="flex gap-3 items-center">
                    <div class="text-sm font-bold text-gray-800">{{ item.name }}</div>
                </div>
                <div class="font-black text-blue-600 text-sm">{{ item.qty }} x {{ formatRupiah(item.price_sell) }}</div>
            </div>

            <div v-if="cart.length > 0" class="bg-white p-5 rounded-[2rem] border border-blue-100 shadow-sm mt-4">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Metode Pembayaran</label>
                
                <div class="grid grid-cols-3 gap-2 mb-4">
                    <button @click="payMethod = 'cash'" :class="payMethod === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500'" class="py-3 rounded-xl border-none text-[10px] font-black transition-all">CASH</button>
                    <button @click="payMethod = 'qris'" :class="payMethod === 'qris' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-500'" class="py-3 rounded-xl border-none text-[10px] font-black transition-all">QRIS</button>
                    <button @click="payMethod = 'tempo'" :class="payMethod === 'tempo' ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500'" class="py-3 rounded-xl border-none text-[10px] font-black transition-all">TEMPO</button>
                </div>

                <div v-if="payMethod === 'cash'" class="animate-slide-up">
                    <div class="flex flex-col gap-1 mb-3">
                        <label class="text-[10px] font-black text-blue-500 uppercase">Uang Tunai</label>
                        <input v-model.number="cashAmount" type="number" class="form-control !text-lg font-bold text-blue-600" placeholder="0">
                    </div>
                    <div class="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                        <span class="text-[10px] font-bold text-blue-400 uppercase">Kembalian</span>
                        <span class="text-lg font-black text-blue-600">{{ formatRupiah(kembalian) }}</span>
                    </div>
                </div>

                <div v-if="payMethod === 'qris'" class="p-4 bg-purple-50 rounded-xl text-center animate-slide-up">
                    <i class="ri-qr-code-line text-3xl text-purple-600"></i>
                    <p class="text-[10px] font-bold text-purple-500 mt-1 uppercase">Pembayaran via QRIS / E-Wallet</p>
                </div>

                <div v-if="payMethod === 'tempo'" class="p-4 bg-orange-50 rounded-xl text-center animate-slide-up">
                    <i class="ri-calendar-todo-line text-3xl text-orange-600"></i>
                    <p class="text-[10px] font-bold text-orange-500 mt-1 uppercase">Hutang akan dicatat pada Member</p>
                </div>

                <button @click="submitOrder" class="w-full mt-5 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    Selesaikan Pesanan
                </button>
            </div>
        </div>`
};
