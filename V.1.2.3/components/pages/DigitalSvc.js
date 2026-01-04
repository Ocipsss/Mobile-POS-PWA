const PageDigitalSvc = {
    setup() {
        const form = Vue.ref({
            type: 'topup',
            provider: '', 
            nominal: null,
            adminFee: 2000,
            adminPaymentMethod: 'cash'
        });

        const saveTransaction = async () => {
            if (!form.value.provider || !form.value.nominal) return alert("Lengkapi data!");
            
            const doc = {
                date: new Date().toISOString(),
                ...form.value,
                nominal: Number(form.value.nominal),
                adminFee: Number(form.value.adminFee),
                profit: Number(form.value.adminFee)
            };

            try {
                await db.digital_transactions.add(doc);
                alert("Transaksi Berhasil!");
                form.value = { type: 'topup', provider: '', nominal: null, adminFee: 2000, adminPaymentMethod: 'cash' };
            } catch (err) { alert(err.message); }
        };

        return { form, saveTransaction };
    },
    template: `
    <div class="w-full flex flex-col gap-4 py-2 animate-zoom-in">
        <div class="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
            
            <div class="flex bg-gray-100 p-1.5 rounded-2xl mb-8 gap-2">
                <button @click="form.type = 'topup'" 
                    :class="form.type === 'topup' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'" 
                    class="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest border-none">
                    TOP UP
                </button>
                <button @click="form.type = 'tariktunai'" 
                    :class="form.type === 'tariktunai' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'" 
                    class="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest border-none">
                    TARIK TUNAI
                </button>
            </div>

            <div class="flex flex-col gap-5">
                <div>
                    <label class="text-[8px] font-black text-gray-400 ml-1 uppercase tracking-[0.2em]">Layanan / Provider</label>
                    <input v-model="form.provider" type="text" placeholder="DANA, OVO, BRI, DLL" 
                        class="w-full p-4 mt-1 bg-gray-50 border-none rounded-2xl text-[12px] font-black text-gray-800 outline-none uppercase transition-all placeholder:text-gray-300">
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[8px] font-black text-gray-400 ml-1 uppercase tracking-[0.2em]">Nominal (Rp)</label>
                        <input v-model="form.nominal" type="number" placeholder="0" 
                            class="w-full p-4 mt-1 bg-gray-50 border-none rounded-2xl text-[14px] font-black text-blue-600 outline-none transition-all placeholder:text-gray-300">
                    </div>
                    <div>
                        <label class="text-[8px] font-black text-gray-400 ml-1 uppercase tracking-[0.2em]">Biaya Admin</label>
                        <input v-model="form.adminFee" type="number" placeholder="0" 
                            class="w-full p-4 mt-1 bg-gray-50 border-none rounded-2xl text-[14px] font-black text-gray-800 outline-none transition-all placeholder:text-gray-300">
                    </div>
                </div>

                <div>
                    <label class="text-[8px] font-black text-gray-400 ml-1 uppercase tracking-[0.2em]">Metode Bayar Admin:</label>
                    <div class="grid grid-cols-2 gap-2 mt-1.5">
                        <button @click="form.adminPaymentMethod = 'cash'" 
                            :class="form.adminPaymentMethod === 'cash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 border-blue-500' : 'bg-gray-100 text-gray-400 border-transparent'" 
                            class="py-3 rounded-xl text-[9px] font-black uppercase transition-all border outline-none">UANG TUNAI</button>
                        <button @click="form.adminPaymentMethod = 'digital'" 
                            :class="form.adminPaymentMethod === 'digital' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 border-blue-500' : 'bg-gray-100 text-gray-400 border-transparent'" 
                            class="py-3 rounded-xl text-[9px] font-black uppercase transition-all border outline-none">POTONG SALDO</button>
                    </div>
                </div>
                
                <div :class="form.type === 'topup' ? 'bg-blue-600 border-blue-500' : 'bg-orange-500 border-orange-400'" 
                    class="p-5 rounded-[1.8rem] shadow-xl shadow-gray-100 border mt-2 transition-colors duration-500">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[8px] font-black text-white/70 uppercase tracking-widest">Estimasi Kas Fisik</span>
                        <div class="px-2 py-0.5 bg-white/20 rounded text-[7px] font-black text-white uppercase tracking-tighter">
                            {{ form.type === 'topup' ? 'IN' : 'OUT' }}
                        </div>
                    </div>
                    
                    <div v-if="form.type === 'topup'" class="text-2xl font-black text-white tracking-tighter">
                        + Rp {{ (Number(form.nominal) + (form.adminPaymentMethod === 'cash' ? Number(form.adminFee) : 0)).toLocaleString() }}
                    </div>
                    <div v-else class="text-2xl font-black text-white tracking-tighter">
                        - Rp {{ (Number(form.nominal) - (form.adminPaymentMethod === 'cash' ? Number(form.adminFee) : 0)).toLocaleString() }}
                    </div>
                    <p class="text-[8px] font-medium text-white/50 uppercase mt-2 italic tracking-tighter leading-none">*Otomatis menyesuaikan laci kas</p>
                </div>

                <button @click="saveTransaction" 
                    class="w-full py-4.5 bg-gray-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl mt-2 active:scale-95 transition-all border-none outline-none">
                    SIMPAN TRANSAKSI
                </button>
            </div>
        </div>
    </div>
    `
};
