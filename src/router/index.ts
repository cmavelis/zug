import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MatchView from '../views/MatchView.vue';
import MatchConfiguration from '@/components/MatchConfiguration.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/how-to-play',
      name: 'how-to-play',
      component: () => import('../views/HowToPlayView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/match/:matchID',
      name: 'match',
      component: MatchView,
    },
    {
      path: '/match-configure',
      name: 'match-configure',
      component: MatchConfiguration,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/DiscordLogin.vue'),
    },
  ],
});

export default router;
