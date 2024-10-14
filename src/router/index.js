import { createRouter, createWebHistory } from 'vue-router'
import TeamSelectionView from '../views/TeamSelectionView.vue'
import PhotoboothView from '../views/PhotoboothView.vue'
import TeamboothView from '../views/TeamboothView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'teamselection',
      component: TeamSelectionView
    },
    {
      path: '/photobooth',
      name: 'photobooth',
      component: PhotoboothView
    },
    {
      path: '/teambooth',
      name: 'teambooth',
      component: TeamboothView
    }
  ]
});

export default router
