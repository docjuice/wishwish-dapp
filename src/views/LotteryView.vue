<template>
  <div>
    <!-- Confetti overlay -->
    <div v-if="showConfetti" class="confetti-container">
      <div
        v-for="n in 40"
        :key="'c'+n"
        class="confetti-piece"
        :style="confettiStyle(n)"
      />
    </div>

    <v-row>
      <!-- LEFT: Game Panel -->
      <v-col cols="12" md="7" class="anim-fade-in-up">
        <!-- Stats row -->
        <v-row dense class="mb-4">
          <v-col cols="6" sm="3">
            <div class="glass-card pa-4 text-center">
              <div class="stat-value gradient-text">{{ lotteryPrice }}</div>
              <div class="stat-label">Цена билета (ETH)</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="glass-card pa-4 text-center">
              <div class="stat-value" style="color: var(--gold)">{{ prizeAmount }}</div>
              <div class="stat-label">Приз (ETH)</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="glass-card pa-4 text-center">
              <div class="stat-value" style="color: var(--green-bright)">{{ winChance }}%</div>
              <div class="stat-label">Шанс</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="glass-card pa-4 text-center">
              <div class="stat-value white--text">{{ contractBalance }}</div>
              <div class="stat-label">Баланс (ETH)</div>
            </div>
          </v-col>
        </v-row>

        <!-- Play card -->
        <div class="glass-card pa-6 mb-4">
          <!-- Guarantee progress -->
          <div class="mb-4">
            <div class="d-flex justify-space-between mb-2">
              <span class="caption" style="color: var(--text-secondary)">
                Стрик проигрышей
              </span>
              <span class="caption font-weight-bold" :style="{ color: streakColor }">
                {{ currentStreak }} / {{ guarantee }}
              </span>
            </div>
            <div class="guarantee-bar">
              <div
                class="guarantee-bar-fill"
                :class="{ danger: streakPercent > 70 }"
                :style="{ width: streakPercent + '%' }"
              />
            </div>
            <div v-if="currentStreak >= guarantee" class="mt-1 caption" style="color: var(--gold)">
              Следующая игра — гарантированный выигрыш!
            </div>
          </div>

          <!-- Pending prize -->
          <v-alert
            v-if="pendingPrizeAmount > 0"
            type="warning"
            text
            dense
            class="mb-4"
          >
            У вас есть невыплаченный приз: <strong>{{ pendingPrizeFormatted }} ETH</strong>
            <v-btn x-small color="warning" class="ml-2" @click="claimPrize" :loading="claiming">
              Забрать
            </v-btn>
          </v-alert>

          <!-- Play button -->
          <v-btn
            block
            x-large
            depressed
            class="play-btn"
            :class="{ 'anim-pulse': !playing && isConnected }"
            :loading="playing"
            :disabled="!isConnected"
            @click="playGame"
          >
            <v-icon left large>mdi-dice-multiple</v-icon>
            <span class="text-h6 font-weight-bold">Играть — {{ lotteryPrice }} ETH</span>
          </v-btn>

          <div v-if="playing" class="text-center mt-3">
            <v-progress-linear indeterminate color="secondary" rounded height="3" />
            <span class="caption mt-1 d-block" style="color: var(--text-secondary)">
              Ожидание VRF...
            </span>
          </div>
        </div>

        <!-- Result overlay -->
        <v-dialog v-model="resultDialog" max-width="420" persistent>
          <div
            class="result-card glass-card pa-8 text-center"
            :class="lastResult.won ? 'result-win' : 'result-lose'"
          >
            <div class="result-icon mb-4">
              <v-icon :size="72" :color="lastResult.won ? 'warning' : 'error'">
                {{ lastResult.won ? 'mdi-trophy' : 'mdi-emoticon-sad-outline' }}
              </v-icon>
            </div>
            <h2 class="text-h4 font-weight-black mb-3" :style="{ color: lastResult.won ? 'var(--gold)' : 'var(--red-soft)' }">
              {{ lastResult.won ? 'ВЫИГРЫШ!' : 'Не повезло' }}
            </h2>
            <p v-if="lastResult.won" class="text-h6 white--text mb-1">
              +{{ lastResult.prize }} ETH
            </p>
            <p v-else class="body-1" style="color: var(--text-secondary)">
              Стрик: {{ currentStreak }} / {{ guarantee }}. Пробуйте ещё!
            </p>
            <v-btn
              class="glow-btn mt-6"
              large
              depressed
              @click="resultDialog = false"
            >
              {{ lastResult.won ? 'Отлично!' : 'Попробовать ещё' }}
            </v-btn>
          </div>
        </v-dialog>
      </v-col>

      <!-- RIGHT: Event Log -->
      <v-col cols="12" md="5" class="anim-fade-in-up" style="animation-delay: 0.15s">
        <div class="glass-card pa-5" style="min-height: 400px">
          <div class="d-flex align-center mb-4">
            <v-icon small color="secondary" class="mr-2">mdi-history</v-icon>
            <span class="text-subtitle-1 font-weight-bold white--text">Журнал</span>
            <v-spacer />
            <v-btn icon x-small @click="refreshData">
              <v-icon small>mdi-refresh</v-icon>
            </v-btn>
          </div>

          <div style="max-height: 500px; overflow-y: auto">
            <transition-group name="list" tag="div">
              <div
                v-for="(evt, i) in events"
                :key="evt.id || i"
                class="event-item d-flex align-center pa-3 mb-2"
              >
                <div class="event-dot mr-3" :class="eventDotClass(evt)" />
                <div class="flex-grow-1">
                  <div class="caption font-weight-medium white--text">
                    <template v-if="evt.type === 'request'">
                      Запрос от {{ shortAddr(evt.player) }}
                    </template>
                    <template v-else>
                      <span :style="{ color: evt.won ? 'var(--gold)' : 'var(--red-soft)' }">
                        {{ evt.won ? 'ВЫИГРЫШ' : 'ПРОИГРЫШ' }}
                      </span>
                      — {{ shortAddr(evt.player) }}
                    </template>
                  </div>
                </div>
                <div v-if="evt.won && evt.prize" class="caption font-weight-bold" style="color: var(--gold)">
                  +{{ evt.prize }} ETH
                </div>
              </div>
            </transition-group>

            <div v-if="events.length === 0" class="text-center pa-8">
              <v-icon size="48" style="opacity: 0.15">mdi-dice-multiple-outline</v-icon>
              <p class="caption mt-3" style="color: var(--text-secondary)">
                Событий пока нет. Сыграйте!
              </p>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="errorSnackbar" color="error" timeout="5000" top>
      {{ errorMsg }}
    </v-snackbar>
  </div>
</template>

<script>
import { ethers } from "ethers";
import { mapState, mapGetters, mapActions } from "vuex";
import { getLotteryContract } from "@/config/contracts";

let eventIdCounter = 0;

export default {
  name: "LotteryView",
  data() {
    return {
      lotteryPrice: "0",
      prizeAmount: "0",
      winChance: 0,
      guarantee: 0,
      currentStreak: 0,
      contractBalance: "0",
      pendingPrizeAmount: 0,
      playing: false,
      claiming: false,
      resultDialog: false,
      showConfetti: false,
      lastResult: { won: false, prize: "0" },
      events: [],
      errorSnackbar: false,
      errorMsg: "",
    };
  },
  computed: {
    ...mapState("wallet", ["signer", "provider", "address"]),
    ...mapGetters("wallet", ["isConnected"]),
    streakPercent() {
      if (!this.guarantee) return 0;
      return Math.min(100, (this.currentStreak / this.guarantee) * 100);
    },
    streakColor() {
      if (this.streakPercent > 70) return "var(--gold)";
      if (this.streakPercent > 40) return "var(--accent-pink)";
      return "var(--text-secondary)";
    },
    pendingPrizeFormatted() {
      return ethers.utils.formatEther(this.pendingPrizeAmount.toString());
    },
  },
  watch: {
    address() {
      this.refreshData();
      this.setupEventListeners();
    },
  },
  methods: {
    ...mapActions("wallet", ["refreshBalance"]),

    shortAddr(addr) {
      if (!addr) return "";
      return addr.slice(0, 6) + "..." + addr.slice(-4);
    },

    eventDotClass(evt) {
      if (evt.type === "request") return "dot-pending";
      return evt.won ? "dot-win" : "dot-lose";
    },

    confettiStyle(n) {
      const colors = ["#FFD600", "#E040FB", "#7C4DFF", "#00E5FF", "#00E676", "#FF5252"];
      return {
        left: Math.random() * 100 + "%",
        background: colors[n % colors.length],
        animationDelay: Math.random() * 2 + "s",
        animationDuration: 2 + Math.random() * 2 + "s",
        width: 6 + Math.random() * 8 + "px",
        height: 6 + Math.random() * 8 + "px",
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      };
    },

    async refreshData() {
      if (!this.provider) return;
      try {
        const lottery = getLotteryContract(this.provider);
        const [price, prize, chance, guar, balance] = await Promise.all([
          lottery.lotteryPrice(),
          lottery.prizeAmount(),
          lottery.winChance(),
          lottery.guarantee(),
          lottery.getBalance(),
        ]);
        this.lotteryPrice = ethers.utils.formatEther(price);
        this.prizeAmount = ethers.utils.formatEther(prize);
        this.winChance = chance.toNumber();
        this.guarantee = guar.toNumber();
        this.contractBalance = ethers.utils.formatEther(balance);

        if (this.address) {
          const streak = await lottery.viewGuarantee(this.address);
          this.currentStreak = typeof streak === "number" ? streak : streak.toNumber();
          const pending = await lottery.viewPendingPrize(this.address);
          this.pendingPrizeAmount = pending;
        }
      } catch (e) {
        console.error("refreshData:", e);
      }
    },

    setupEventListeners() {
      if (!this.provider) return;
      const lottery = getLotteryContract(this.provider);
      lottery.removeAllListeners();

      lottery.on("GameRequested", (requestId, player) => {
        this.events.unshift({
          id: ++eventIdCounter,
          type: "request",
          requestId: requestId.toString(),
          player,
        });
      });

      lottery.on("GameResult", (player, won, prize) => {
        this.events.unshift({
          id: ++eventIdCounter,
          type: "result",
          player,
          won,
          prize: ethers.utils.formatEther(prize),
        });

        if (player.toLowerCase() === this.address?.toLowerCase()) {
          this.lastResult = { won, prize: ethers.utils.formatEther(prize) };
          this.playing = false;
          this.resultDialog = true;
          if (won) {
            this.showConfetti = true;
            setTimeout(() => { this.showConfetti = false; }, 3500);
          }
          this.refreshData();
          this.refreshBalance();
        }
      });
    },

    async playGame() {
      if (!this.signer) return;
      this.playing = true;
      try {
        const lottery = getLotteryContract(this.signer);
        const price = await lottery.lotteryPrice();
        const tx = await lottery.playGame({ value: price });
        await tx.wait();
      } catch (e) {
        this.playing = false;
        this.errorMsg = e.reason || e.data?.message || e.message || "Ошибка";
        this.errorSnackbar = true;
      }
    },

    async claimPrize() {
      if (!this.signer) return;
      this.claiming = true;
      try {
        const lottery = getLotteryContract(this.signer);
        const tx = await lottery.claimPrize();
        await tx.wait();
        this.refreshData();
        this.refreshBalance();
      } catch (e) {
        this.errorMsg = e.reason || e.message || "Ошибка";
        this.errorSnackbar = true;
      } finally {
        this.claiming = false;
      }
    },
  },

  mounted() {
    this.refreshData();
    this.setupEventListeners();
    this.refreshInterval = setInterval(() => this.refreshData(), 10000);
  },

  beforeDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    try { getLotteryContract(this.provider).removeAllListeners(); } catch (e) { /* */ }
  },
};
</script>

<style scoped>
.play-btn {
  background: linear-gradient(135deg, #7C4DFF 0%, #E040FB 100%) !important;
  border-radius: 16px !important;
  height: 64px !important;
  font-weight: 800 !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 6px 30px rgba(124, 77, 255, 0.4) !important;
  transition: transform 0.2s ease, box-shadow 0.3s ease !important;
}

.play-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 40px rgba(224, 64, 251, 0.5) !important;
}

.play-btn:active {
  transform: scale(0.98);
}

.event-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.2s ease;
}

.event-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.event-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-pending {
  background: #2196F3;
  box-shadow: 0 0 6px rgba(33, 150, 243, 0.5);
}

.dot-win {
  background: #FFD600;
  box-shadow: 0 0 6px rgba(255, 214, 0, 0.5);
}

.dot-lose {
  background: #FF5252;
  box-shadow: 0 0 6px rgba(255, 82, 82, 0.3);
}

.result-card {
  border-radius: 24px !important;
  overflow: hidden;
}

.result-win {
  border-color: rgba(255, 214, 0, 0.25) !important;
  box-shadow: 0 0 60px rgba(255, 214, 0, 0.15) !important;
}

.result-win .result-icon {
  animation: coin-bounce 0.8s ease both;
}

.result-lose {
  border-color: rgba(255, 82, 82, 0.2) !important;
}

.result-lose .result-icon {
  animation: shake 0.5s ease;
}
</style>
