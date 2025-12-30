// components/Layout.js
const SidebarComponent = {
    props: ['groups', 'activePage'],
    template: `
        <div class="back-menu">
            <div class="brand-section">
                <span class="brand-name">SINAR PAGI</span>
            </div>
            <div v-for="group in groups" :key="group.title">
                <div class="menu-group-title">{{ group.title }}</div>
                <ul class="menu-list">
                    <li v-for="m in group.items" 
                        class="menu-item" 
                        :class="{ active: activePage === m.name }"
                        @click="$emit('select-page', m.name)"> 
                        <i :class="m.icon"></i>
                        <span>{{ m.name }}</span>
                    </li>
                </ul>
            </div>
        </div>
    `
};
