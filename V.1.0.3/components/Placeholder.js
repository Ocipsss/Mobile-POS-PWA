//components/Placeholder.js
const PlaceholderComponent = {
    props: ['pageName'],
    template: `
        <div class="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                <i class="ri-tools-line text-5xl text-gray-500"></i>
            </div>
            <h4 class="m-0 text-gray-800 text-xl font-bold">{{ pageName }}</h4>
            <p class="text-sm text-gray-600 mt-2">
                Halaman ini sedang dalam tahap pengembangan <br> 
                oleh tim Sinar Pagi.
            </p>
            <div class="mt-8 px-6 py-2 border-2 border-dashed border-gray-300 rounded-lg">
                <span class="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    Module: modules/{{ pageName.replace(/\s+/g, '-').toLowerCase() }}.js
                </span>
            </div>
        </div>
    `
};
