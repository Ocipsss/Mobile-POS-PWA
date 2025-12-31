window.PageLabaRugi = {
    template: `
        <div class="p-6 space-y-7 pb-24 bg-white min-h-full">
            
            <div class="flex items-center bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                <div class="flex-1">
                    <input type="date" v-model="filter.start" @change="loadData" 
                        class="w-full bg-transparent border-none text-[10px] font-black text-slate-500 focus:ring-0 py-2 px-3 uppercase tracking-tighter text-center">
                </div>
                <div class="w-[1px] h-4 bg-slate-200"></div>
                <div class="flex-1">
                    <input type="date" v-model="filter.end" @change="loadData" 
                        class="w-full bg-transparent border-none text-[10px] font-black text-slate-500 focus:ring-0 py-2 px-3 uppercase tracking-tighter text-center">
                </div>
            </div>

            <div class="py-4">
                <p class="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-3 text-center">Net Profit</p>
                <div class="text-center">
                    <h3 class="text-5xl font-black text-slate-800 tracking-tighter inline-block">
                        <span class="text-blue-500 text-lg align-top mr-1 font-bold">Rp</span>{{ stats.totalLabaBersih.toLocaleString('id-ID') }}
                    </h3>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
                    </div>
                    <p class="text-sm font-black text-slate-700">Rp {{ stats.totalOmzet.toLocaleString('id-ID') }}</p>
                </div>

                <div class="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                        <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Expenses</span>
                    </div>
                    <p class="text-sm font-black text-slate-700">Rp {{ stats.totalModal.toLocaleString('id-ID') }}</p>
                </div>
            </div>

            <div class="bg-blue-50/50 rounded-[2rem] p-6 border border-blue-100/50 flex justify-between items-center">
                <div>
                    <p class="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1 text-left">Margin Profit</p>
                    <p class="text-xl font-black text-blue-600 tracking-tight">{{ calculateMargin() }}%</p>
                </div>
                <div class="text-right">
                    <p class="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Avg per Sale</p>
                    <p class="text-xs font-black text-slate-600">Rp {{ calculateAvg().toLocaleString('id-ID') }}</p>
                </div>
            </div>

            <div class="flex justify-center items-center gap-2 pt-2">
                <div class="h-[1px] w-8 bg-slate-100"></div>
                <p class="text-[9px] font-black text-slate-300 uppercase tracking-widest">{{ stats.count }} Transactions</p>
                <div class="h-[1px] w-8 bg-slate-100"></div>
            </div>

            <div v-if="stats.count === 0" class="py-10 text-center text-slate-200">
                <i class="ri-bar-chart-2-line text-4xl opacity-20"></i>
            </div>
        </div>
    `,
    setup() {
        const stats = Vue.ref({ totalOmzet: 0, totalModal: 0, totalLabaBersih: 0, count: 0 });
        const now = new Date();
        const filter = Vue.ref({
            start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        });

        const loadData = async () => {
            const startStr = filter.value.start + "T00:00:00.000Z";
            const endStr = filter.value.end + "T23:59:59.999Z";
            if (window.hitungLabaRugi) {
                const res = await window.hitungLabaRugi(startStr, endStr);
                stats.value = res;
            }
        };

        const calculateMargin = () => {
            if (stats.value.totalOmzet === 0) return 0;
            return ((stats.value.totalLabaBersih / stats.value.totalOmzet) * 100).toFixed(1);
        };

        const calculateAvg = () => {
            if (stats.value.count === 0) return 0;
            return Math.round(stats.value.totalLabaBersih / stats.value.count);
        };

        Vue.onMounted(loadData);
        return { stats, filter, loadData, calculateMargin, calculateAvg };
    }
};
