<template>
  <v-app>
    <v-app-bar app flat class="app-bar-glass" height="64">
      <div class="d-flex align-center">
        <span class="logo-text gradient-text text-h5 font-weight-black mr-1">WISH</span>
        <span class="logo-text text-h5 font-weight-light white--text" style="opacity:.7">WISH</span>
      </div>
      <v-spacer />
      <v-btn
        text
        :to="{ name: 'Lottery' }"
        class="nav-btn mr-1"
        active-class="nav-btn-active"
      >
        <v-icon left small>mdi-slot-machine</v-icon>
        Лотерея
      </v-btn>
      <v-btn
        text
        :to="{ name: 'Staking' }"
        class="nav-btn mr-1"
        active-class="nav-btn-active"
      >
        <v-icon left small>mdi-diamond-stone</v-icon>
        Стейкинг
      </v-btn>
      <v-btn
        text
        :to="{ name: 'Governance' }"
        class="nav-btn mr-4"
        active-class="nav-btn-active"
      >
        <v-icon left small>mdi-vote</v-icon>
        DAO
      </v-btn>
      <connect-wallet />
    </v-app-bar>

    <v-main class="main-bg">
      <v-container fluid class="pa-4 pa-md-8" style="max-width: 1400px">
        <transition name="page" mode="out-in">
          <router-view :key="$route.path" />
        </transition>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import ConnectWallet from "@/components/ConnectWallet.vue";
export default {
  name: "App",
  components: { ConnectWallet },
};
</script>

<style scoped>
.app-bar-glass {
  background: rgba(15, 14, 23, 0.85) !important;
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.logo-text {
  letter-spacing: 2px;
  user-select: none;
}

.nav-btn {
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  font-weight: 500 !important;
  opacity: 0.65;
  transition: opacity 0.2s ease, background 0.2s ease !important;
  border-radius: 10px !important;
}

.nav-btn:hover {
  opacity: 1;
  background: rgba(124, 77, 255, 0.1) !important;
}

.nav-btn-active {
  opacity: 1 !important;
  background: rgba(124, 77, 255, 0.15) !important;
}

.main-bg {
  background: #0f0e17;
  min-height: 100vh;
}
</style>
