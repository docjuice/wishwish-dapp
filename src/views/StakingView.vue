<template>
  <div>
    <v-row>
      <!-- Your Stake -->
      <v-col cols="12" md="5" class="anim-fade-in-up">
        <div class="glass-card pa-5">
          <div class="d-flex align-center mb-4">
            <v-icon color="warning" class="mr-2">mdi-star-circle</v-icon>
            <span class="text-subtitle-1 font-weight-bold white--text">Ваш стейкинг</span>
          </div>

          <div class="d-flex justify-space-between mb-2">
            <div>
              <div class="stat-value gradient-text">{{ stakedFormatted }}</div>
              <div class="stat-label">WISH застейкано</div>
            </div>
            <div class="text-right">
              <div class="stat-value white--text">{{ wishBalance }}</div>
              <div class="stat-label">WISH на кошельке</div>
            </div>
          </div>

          <v-chip v-if="currentTierName" :color="tierColor" dark small class="mb-4">
            {{ currentTierName }}
          </v-chip>
          <v-chip v-else color="grey" dark small class="mb-4">Нет тира</v-chip>

          <v-text-field
            v-model="stakeInput"
            label="Количество WISH"
            dense outlined dark hide-details type="number"
            class="mb-3"
          />

          <div class="d-flex" style="gap: 8px">
            <v-btn depressed class="glow-btn flex-grow-1" :loading="staking" :disabled="!isConnected" @click="doStake">
              <v-icon left small>mdi-lock</v-icon> Стейк
            </v-btn>
            <v-btn depressed outlined dark class="flex-grow-1" :loading="unstaking" :disabled="!isConnected" @click="doUnstake">
              <v-icon left small>mdi-lock-open</v-icon> Анстейк
            </v-btn>
          </div>
        </div>
      </v-col>

      <!-- Tiers info -->
      <v-col cols="12" md="7" class="anim-fade-in-up" style="animation-delay:.1s">
        <div class="glass-card pa-5">
          <div class="d-flex align-center mb-4">
            <v-icon color="secondary" class="mr-2">mdi-podium</v-icon>
            <span class="text-subtitle-1 font-weight-bold white--text">Тиры стейкинга</span>
          </div>

          <div v-for="(t, idx) in tiersList" :key="idx" class="tier-card mb-3 pa-4" :class="{ 'tier-active': currentTierIdx === idx + 1 }">
            <v-row no-gutters align="center">
              <v-col cols="auto" class="mr-3">
                <v-icon :color="t.color">{{ t.icon }}</v-icon>
              </v-col>
              <v-col>
                <div class="body-2 font-weight-bold" :style="{ color: t.color }">{{ t.name }}</div>
                <div class="caption" style="color: var(--text-secondary)">
                  от {{ t.minStake }} WISH
                </div>
              </v-col>
              <v-col cols="auto" class="text-right">
                <div class="caption font-weight-bold" style="color: var(--green-bright)">
                  +{{ t.bonusChance }}% шанс
                </div>
                <div v-if="t.discount > 0" class="caption" style="color: var(--accent-pink)">
                  -{{ t.discount }}% ставка
                </div>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="snack" :color="snackColor" timeout="4000" top>{{ snackMsg }}</v-snackbar>
  </div>
</template>

<script>
import { ethers } from "ethers";
import { mapState, mapGetters } from "vuex";
import { getGovernTokenContract, getWishStakingContract, deployments } from "@/config/contracts";

export default {
  name: "StakingView",
  data() {
    return {
      stakedAmount: "0",
      wishBalanceRaw: "0",
      currentTierIdx: 0,
      stakeInput: "",
      staking: false,
      unstaking: false,
      snack: false, snackMsg: "", snackColor: "success",
      tiersList: [
        { name: "Bronze", minStake: "1,000", bonusChance: 1, discount: 0, color: "#CD7F32", icon: "mdi-shield-outline" },
        { name: "Silver", minStake: "10,000", bonusChance: 2, discount: 3, color: "#C0C0C0", icon: "mdi-shield-half-full" },
        { name: "Gold", minStake: "50,000", bonusChance: 3, discount: 5, color: "#FFD600", icon: "mdi-shield" },
        { name: "Diamond", minStake: "200,000", bonusChance: 5, discount: 8, color: "#00E5FF", icon: "mdi-diamond-stone" },
      ],
    };
  },
  computed: {
    ...mapState("wallet", ["signer", "provider", "address"]),
    ...mapGetters("wallet", ["isConnected"]),
    stakedFormatted() { return parseFloat(ethers.utils.formatEther(this.stakedAmount)).toLocaleString("ru-RU", { maximumFractionDigits: 0 }); },
    wishBalance() { return parseFloat(ethers.utils.formatEther(this.wishBalanceRaw)).toLocaleString("ru-RU", { maximumFractionDigits: 0 }); },
    currentTierName() { return this.currentTierIdx > 0 ? this.tiersList[this.currentTierIdx - 1]?.name : null; },
    tierColor() {
      if (!this.currentTierIdx) return "grey";
      return this.tiersList[this.currentTierIdx - 1]?.color || "grey";
    },
  },
  watch: { address() { this.loadData(); } },
  methods: {
    msg(t, c = "success") { this.snackMsg = t; this.snackColor = c; this.snack = true; },

    async loadData() {
      if (!this.provider || !this.address) return;
      try {
        const token = getGovernTokenContract(this.provider);
        const stk = getWishStakingContract(this.provider);
        const [bal, staked, tier] = await Promise.all([
          token.balanceOf(this.address),
          stk.getStakedAmount(this.address),
          stk.getTier(this.address),
        ]);
        this.wishBalanceRaw = bal.toString();
        this.stakedAmount = staked.toString();
        this.currentTierIdx = typeof tier === "number" ? tier : tier.toNumber ? tier.toNumber() : Number(tier);
      } catch (e) { console.error("staking loadData:", e); }
    },

    async doStake() {
      if (!this.signer || !this.stakeInput) return;
      this.staking = true;
      try {
        const amount = ethers.utils.parseEther(this.stakeInput);
        const token = getGovernTokenContract(this.signer);
        const approveTx = await token.approve(deployments.wishStaking, amount);
        await approveTx.wait();
        const stk = getWishStakingContract(this.signer);
        const tx = await stk.stake(amount);
        await tx.wait();
        this.msg(`Застейкано ${this.stakeInput} WISH`);
        this.stakeInput = "";
        this.loadData();
      } catch (e) { this.msg(e.reason || e.message, "error"); }
      finally { this.staking = false; }
    },

    async doUnstake() {
      if (!this.signer || !this.stakeInput) return;
      this.unstaking = true;
      try {
        const amount = ethers.utils.parseEther(this.stakeInput);
        const stk = getWishStakingContract(this.signer);
        const tx = await stk.unstake(amount);
        await tx.wait();
        this.msg(`Выведено ${this.stakeInput} WISH`);
        this.stakeInput = "";
        this.loadData();
      } catch (e) { this.msg(e.reason || e.message, "error"); }
      finally { this.unstaking = false; }
    },
  },
  mounted() { this.loadData(); },
};
</script>

<style scoped>
.tier-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  transition: all 0.25s ease;
}
.tier-card:hover {
  background: rgba(255, 255, 255, 0.05);
}
.tier-active {
  border-color: rgba(124, 77, 255, 0.4) !important;
  background: rgba(124, 77, 255, 0.08) !important;
  box-shadow: 0 0 20px rgba(124, 77, 255, 0.15);
}
</style>
