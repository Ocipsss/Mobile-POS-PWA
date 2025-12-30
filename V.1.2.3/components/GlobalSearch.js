// components/GlobalSearch.js
const GlobalSearchComponent = {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: `
        <div class="relative flex items-center group w-full">
            <input 
                :value="modelValue" 
                @input="$emit('update:modelValue', $event.target.value)"
                type="text" 
                :placeholder="placeholder || 'Cari...'" 
                class="w-full pl-4 pr-20 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm !mb-0"
            >
            <div class="absolute right-3 flex items-center gap-2">
                <button v-if="modelValue" @click="$emit('update:modelValue', '')" class="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full border-none">
                    <i class="ri-close-line text-gray-500"></i>
                </button>
                <i class="ri-search-2-line text-gray-400 group-focus-within:text-blue-500 text-lg mr-1"></i>
            </div>
        </div>
    `
};
