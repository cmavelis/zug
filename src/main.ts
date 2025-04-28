import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import App from './App.vue';
import router from './router';
import { clerkPlugin } from '@clerk/vue';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

import './assets/main.css';
import './assets/theme/theme.css';
import 'primeicons/primeicons.css';
import './assets/icons/zug-icons.css';

document.title = import.meta.env.VITE_APP_TITLE;

const app = createApp(App);

app.use(router);
app.use(PrimeVue);
app.use(ToastService);
app.use(clerkPlugin, { publishableKey: PUBLISHABLE_KEY });
app.directive('tooltip', Tooltip);

app.mount('#app');
