import LoginPage from '@/components/login/LoginPage.vue';
import HomeApp from '@/components/home/HomePage.vue';

export const routes = [
  {
    path: '',
    component: () => import('@/layout/LayoutWithoutSideBar.vue'),
    children: [
      {
        path: '',
        component: LoginPage,
        name: 'login',
        meta: {
          roles: ['UNSECURE'],
        },
      },
      {
        path: '/:pathMatch(.*)*',
        component: () => import('@/components/notFound/NotFound.vue'),
        name: 'notFound',
        meta: {
          roles: ['UNSECURE'],
        },
      },
    ],
  },
  {
    path: '',
    component: () => import('@/layout/LayoutWithSideBar.vue'),
    children: [
      {
        path: '/home',
        component: HomeApp,
        name: 'home',
        meta: {
          roles: ['ADM', 'USER'],
        },
      },
      {
        path: '/adm',
        component: () => import('@/components/administrator/AdministratorPage.vue'),
        name: 'adm',
        meta: {
          roles: ['ADM'],
        },
      },
      {
        path: '/movie/:id',
        component: () => import('@/components/movie/MoviePage.vue'),
        name: 'movie',
        meta: {
          roles: ['ADM', 'USER'],
        },
      },
      {
        path: '/add',
        component: () => import('@/components/movie/MoviePage.vue'),
        name: 'add',
        meta: {
          roles: ['ADM', 'USER'],
        },
      },
      {
        path: '/profile',
        component: () => import('@/components/profile/ProfilePage.vue'),
        name: 'profile',
        meta: {
          roles: ['ADM', 'USER'],
        },
      },
    ],
  },
];
