import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Lottery",
    component: () => import("@/views/LotteryView.vue"),
  },
  {
    path: "/governance",
    name: "Governance",
    component: () => import("@/views/GovernanceView.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
