import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import App from './App.vue';
import router from './router';

import './assets/main.css';
import 'primevue/resources/themes/lara-light-green/theme.css';
import './assets/prime-overrides.css';

const app = createApp(App);

app.use(router);
app.use(PrimeVue);
app.use(ToastService);

app.mount('#app');
