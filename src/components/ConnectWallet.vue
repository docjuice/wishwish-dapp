<template>
  <div class="d-inline-flex align-center">
    <v-btn
      v-if="!isConnected"
      class="glow-btn anim-pulse"
      small
      depressed
      @click="connectWallet"
      :loading="loading"
    >
      <v-icon left small>mdi-wallet-outline</v-icon>
      Подключить
    </v-btn>

    <transition name="list">
      <div v-if="isConnected" class="wallet-chip d-flex align-center">
        <div class="network-dot" />
        <span class="white--text caption font-weight-medium mr-2">{{ shortAddress }}</span>
        <v-chip x-small color="rgba(124,77,255,0.25)" dark class="font-weight-bold">
          {{ balanceFormatted }} ETH
        </v-chip>
      </div>
    </transition>

    <v-snackbar v-model="errorSnackbar" color="error" timeout="4000" top>
      {{ errorMessage }}
    </v-snackbar>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from "vuex";

export default {
  name: "ConnectWallet",
  data() {
    return {
      loading: false,
      errorSnackbar: false,
      errorMessage: "",
    };
  },
  computed: {
    ...mapGetters("wallet", ["shortAddress", "isConnected"]),
    ...mapState("wallet", ["balance"]),
    balanceFormatted() {
      if (!this.balance) return "0";
      return parseFloat(this.balance).toFixed(3);
    },
  },
  methods: {
    ...mapActions("wallet", { doConnect: "connect" }),
    async connectWallet() {
      this.loading = true;
      try {
        await this.doConnect();
      } catch (e) {
        this.errorMessage = e.message || "Ошибка подключения";
        this.errorSnackbar = true;
      } finally {
        this.loading = false;
      }
    },
  },
  created() {
    if (window.ethereum) this.connectWallet();
  },
};
</script>

<style scoped>
.wallet-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px 10px 4px 12px;
  animation: fadeInUp 0.4s ease both;
}

.network-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00E676;
  margin-right: 8px;
  box-shadow: 0 0 6px rgba(0, 230, 118, 0.5);
}
</style>
