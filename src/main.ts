import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import App from './App.vue';
import router from './router';

import './assets/main.css';
import './assets/theme/theme.css';
import 'primeicons/primeicons.css';
import './assets/icons/zug-icons.css';

const app = createApp(App);

app.use(router);
app.use(PrimeVue);
app.use(ToastService);
app.directive('tooltip', Tooltip);

app.mount('#app');
