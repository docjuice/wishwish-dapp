<template>
  <div>
    <!-- Confetti -->
    <div v-if="showConfetti" class="confetti-container">
      <div v-for="n in 50" :key="'c'+n" class="confetti-piece" :style="confettiStyle(n)" />
    </div>

    <!-- Jackpot Banner -->
    <div class="jackpot-banner glass-card mb-5 pa-5 text-center anim-fade-in-up">
      <div class="caption text-uppercase" style="letter-spacing: 3px; color: var(--text-secondary)">
        Джекпот
      </div>
      <div class="jackpot-amount">{{ jackpotFormatted }} ETH</div>
      <div class="caption" style="color: var(--text-secondary)">
        Шанс: 0.5% каждой игры
      </div>
    </div>

    <v-row>
      <!-- LEFT: Game -->
      <v-col cols="12" md="7">
        <!-- Stats -->
        <v-row dense class="mb-4">
          <v-col cols="6" sm="3" class="anim-fade-in-up">
            <div class="glass-card pa-4 text-center">
              <div class="stat-value gradient-text">{{ effectiveBet }}</div>
              <div class="stat-label">Ставка (ETH)</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3" class="anim-fade-in-up" style="animation-delay:.05s">
            <div class="glass-card pa-4 text-center">
              <div class="stat-value" style="color:var(--green-bright)">{{ streakMultiplierFormatted }}x</div>
              <div class="stat-label">Множитель</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3" class="anim-fade-in-up" style="animation-delay:.1s">
            <div class="glass-card pa-4 text-center">
              <div class="stat-value white--text">{{ contractBalance }}</div>
              <div class="stat-label">Баланс (ETH)</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3" class="anim-fade-in-up" style="animation-delay:.15s">
            <div class="glass-card pa-4 text-center">
              <div class="stat-value" style="color:var(--accent-pink)">{{ currentStreak }}</div>
              <div class="stat-label">Стрик</div>
            </div>
          </v-col>
        </v-row>

        <!-- Tiers table -->
        <div class="glass-card pa-4 mb-4 anim-fade-in-up" style="animation-delay:.2s">
          <div class="caption font-weight-bold mb-2 white--text">Призовые тиры</div>
          <v-simple-table dense dark>
            <thead>
              <tr>
                <th>Тир</th>
                <th class="text-center">Шанс</th>
                <th class="text-center">Множитель</th>
                <th class="text-center">Приз (ETH)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="opacity:.5"><td>Проигрыш</td><td class="text-center">60%</td><td class="text-center">0x</td><td class="text-center">0</td></tr>
              <tr><td style="color:var(--accent-purple)">Малый</td><td class="text-center">22%</td><td class="text-center">1.2x</td><td class="text-center">{{ tierPrize(120) }}</td></tr>
              <tr><td style="color:var(--accent-pink)">Средний</td><td class="text-center">12%</td><td class="text-center">1.8x</td><td class="text-center">{{ tierPrize(180) }}</td></tr>
              <tr><td style="color:var(--gold)">Крупный</td><td class="text-center">3.5%</td><td class="text-center">3.0x</td><td class="text-center">{{ tierPrize(300) }}</td></tr>
              <tr><td style="color:var(--green-bright)">Огромный</td><td class="text-center">2%</td><td class="text-center">5.0x</td><td class="text-center">{{ tierPrize(500) }}</td></tr>
              <tr><td style="color:var(--gold); font-weight:900">ДЖЕКПОТ</td><td class="text-center">0.5%</td><td class="text-center">Пул</td><td class="text-center" style="color:var(--gold)">{{ jackpotFormatted }}</td></tr>
            </tbody>
          </v-simple-table>
        </div>

        <!-- Streak progress -->
        <div class="glass-card pa-4 mb-4 anim-fade-in-up" style="animation-delay:.25s">
          <div class="d-flex justify-space-between mb-2">
            <span class="caption" style="color:var(--text-secondary)">Стрик до гарантии</span>
            <span class="caption font-weight-bold" :style="{color: streakColor}">
              {{ currentStreak }} / {{ guaranteeCount }}
            </span>
          </div>
          <div class="guarantee-bar">
            <div class="guarantee-bar-fill" :class="{danger: streakPct > 70}" :style="{width: streakPct+'%'}" />
          </div>
          <div v-if="currentStreak >= guaranteeCount" class="mt-2 caption" style="color:var(--gold)">
            Следующая игра — гарантированный выигрыш 3.0x * {{ streakMultiplierFormatted }}x!
          </div>
        </div>

        <!-- Pending prize -->
        <v-alert v-if="pendingAmount > 0" type="warning" text dense class="mb-4">
          Невыплаченный приз: <strong>{{ pendingFormatted }} ETH</strong>
          <v-btn x-small color="warning" class="ml-2" @click="claimPrize" :loading="claiming">Забрать</v-btn>
        </v-alert>

        <!-- Play button -->
        <v-btn
          block x-large depressed class="play-btn"
          :class="{'anim-pulse': !playing && isConnected}"
          :loading="playing" :disabled="!isConnected"
          @click="playGame"
        >
          <v-icon left large>mdi-dice-multiple</v-icon>
          <span class="text-h6 font-weight-bold">Играть — {{ effectiveBet }} ETH</span>
        </v-btn>
        <div v-if="playing" class="text-center mt-3">
          <v-progress-linear indeterminate color="secondary" rounded height="3" />
          <span class="caption mt-1 d-block" style="color:var(--text-secondary)">Ожидание VRF...</span>
        </div>

        <!-- Referral -->
        <div class="glass-card pa-4 mt-4 anim-fade-in-up" style="animation-delay:.3s">
          <div class="caption font-weight-bold mb-2 white--text">Реферальная программа</div>
          <div class="caption mb-1" style="color:var(--text-secondary)">
            Ваша ссылка (поделитесь с друзьями — получайте 5% от каждой их ставки):
          </div>
          <v-text-field
            :value="referralLink"
            readonly dense outlined dark hide-details
            append-icon="mdi-content-copy"
            @click:append="copyRefLink"
            class="mb-2"
          />
          <div class="d-flex justify-space-between">
            <span class="caption" style="color:var(--text-secondary)">Заработок:</span>
            <span class="caption font-weight-bold" style="color:var(--green-bright)">
              {{ refEarnings }} ETH
            </span>
          </div>
          <v-btn
            v-if="refEarningsRaw > 0"
            x-small color="success" class="mt-1"
            @click="claimRefEarnings" :loading="claimingRef"
          >Вывести реферальные</v-btn>
        </div>

        <!-- Result dialog -->
        <v-dialog v-model="resultDialog" max-width="440" persistent>
          <div class="result-card glass-card pa-8 text-center" :class="lastResult.won ? 'result-win' : 'result-lose'">
            <div class="result-icon mb-4">
              <v-icon :size="72" :color="lastResult.isJackpot ? 'warning' : lastResult.won ? 'success' : 'error'">
                {{ lastResult.isJackpot ? 'mdi-crown' : lastResult.won ? 'mdi-trophy' : 'mdi-emoticon-sad-outline' }}
              </v-icon>
            </div>
            <h2 class="text-h4 font-weight-black mb-2" :style="{color: lastResult.isJackpot ? 'var(--gold)' : lastResult.won ? 'var(--green-bright)' : 'var(--red-soft)'}">
              {{ lastResult.isJackpot ? 'ДЖЕКПОТ!!!' : lastResult.won ? lastResult.tierName : 'Мимо...' }}
            </h2>
            <p v-if="lastResult.won" class="text-h5 white--text mb-1">+{{ lastResult.prize }} ETH</p>
            <p v-if="lastResult.won && !lastResult.isJackpot" class="caption" style="color:var(--text-secondary)">
              Множитель {{ lastResult.baseMultiplier }} * стрик {{ lastResult.streakMul }}
            </p>
            <p v-if="!lastResult.won" class="body-1" style="color:var(--text-secondary)">
              Стрик: {{ currentStreak }} / {{ guaranteeCount }}
            </p>
            <v-btn class="glow-btn mt-6" large depressed @click="resultDialog = false">
              {{ lastResult.won ? 'Супер!' : 'Ещё раз' }}
            </v-btn>
          </div>
        </v-dialog>
      </v-col>

      <!-- RIGHT: Events -->
      <v-col cols="12" md="5">
        <div class="glass-card pa-5 anim-fade-in-up" style="animation-delay:.15s; min-height:400px">
          <div class="d-flex align-center mb-4">
            <v-icon small color="secondary" class="mr-2">mdi-history</v-icon>
            <span class="text-subtitle-1 font-weight-bold white--text">Журнал</span>
            <v-spacer />
            <v-btn icon x-small @click="refreshData"><v-icon small>mdi-refresh</v-icon></v-btn>
          </div>
          <div style="max-height:600px; overflow-y:auto">
            <transition-group name="list" tag="div">
              <div v-for="(evt,i) in events" :key="evt.id||i" class="event-item d-flex align-center pa-3 mb-2">
                <div class="event-dot mr-3" :class="eventDotClass(evt)" />
                <div class="flex-grow-1">
                  <div class="caption font-weight-medium white--text">
                    <template v-if="evt.type==='play'">Запрос от {{ shortAddr(evt.player) }}</template>
                    <template v-else>
                      <span :style="{color: evt.isJackpot ? 'var(--gold)' : evt.won ? 'var(--green-bright)' : 'var(--red-soft)'}">
                        {{ evt.isJackpot ? 'ДЖЕКПОТ' : evt.won ? evt.tierName : 'МИМО' }}
                      </span>
                      — {{ shortAddr(evt.player) }}
                    </template>
                  </div>
                </div>
                <div v-if="evt.prize" class="caption font-weight-bold" :style="{color: evt.won ? 'var(--gold)' : ''}">
                  {{ evt.won ? '+' : '' }}{{ evt.prize }} ETH
                </div>
              </div>
            </transition-group>
            <div v-if="events.length===0" class="text-center pa-8">
              <v-icon size="48" style="opacity:.15">mdi-dice-multiple-outline</v-icon>
              <p class="caption mt-3" style="color:var(--text-secondary)">Сыграйте первую игру!</p>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="errorSnackbar" color="error" timeout="5000" top>{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="successSnackbar" color="success" timeout="3000" top>{{ successMsg }}</v-snackbar>
  </div>
</template>

<script>
import { ethers } from "ethers";
import { mapState, mapGetters, mapActions } from "vuex";
import { getLotteryContract, deployments } from "@/config/contracts";

const TIER_NAMES = ["Проигрыш", "Малый приз", "Средний приз", "Крупный приз", "Огромный приз"];
let evtId = 0;

export default {
  name: "LotteryView",
  data() {
    return {
      baseBet: "0", effectiveBet: "0",
      contractBalance: "0", jackpotPool: "0",
      currentStreak: 0, guaranteeCount: 15,
      streakMultiplier: 100,
      pendingAmount: 0, refEarningsRaw: 0,
      playing: false, claiming: false, claimingRef: false,
      resultDialog: false, showConfetti: false,
      lastResult: { won: false, prize: "0", tierName: "", isJackpot: false, baseMultiplier: "", streakMul: "" },
      events: [],
      errorSnackbar: false, errorMsg: "",
      successSnackbar: false, successMsg: "",
    };
  },
  computed: {
    ...mapState("wallet", ["signer", "provider", "address"]),
    ...mapGetters("wallet", ["isConnected"]),
    jackpotFormatted() { return parseFloat(ethers.utils.formatEther(this.jackpotPool || "0")).toFixed(4); },
    pendingFormatted() { return ethers.utils.formatEther(this.pendingAmount.toString()); },
    refEarnings() { return parseFloat(ethers.utils.formatEther(this.refEarningsRaw.toString())).toFixed(6); },
    streakMultiplierFormatted() { return (this.streakMultiplier / 100).toFixed(2); },
    streakPct() { return this.guaranteeCount ? Math.min(100, this.currentStreak / this.guaranteeCount * 100) : 0; },
    streakColor() { return this.streakPct > 70 ? "var(--gold)" : this.streakPct > 40 ? "var(--accent-pink)" : "var(--text-secondary)"; },
    referralLink() { return this.address ? `${window.location.origin}/?ref=${this.address}` : "Подключите кошелёк"; },
  },
  watch: { address() { this.refreshData(); this.setupEvents(); } },
  methods: {
    ...mapActions("wallet", ["refreshBalance"]),
    shortAddr(a) { return a ? a.slice(0,6) + "..." + a.slice(-4) : ""; },
    eventDotClass(e) { return e.type === "play" ? "dot-pending" : e.isJackpot ? "dot-jackpot" : e.won ? "dot-win" : "dot-lose"; },
    confettiStyle(n) {
      const colors = ["#FFD600","#E040FB","#7C4DFF","#00E5FF","#00E676","#FF5252"];
      return { left: Math.random()*100+"%", background: colors[n%colors.length], animationDelay: Math.random()*2+"s", animationDuration: 2+Math.random()*2+"s", width: 6+Math.random()*8+"px", height: 6+Math.random()*8+"px", borderRadius: Math.random()>.5?"50%":"2px" };
    },
    tierPrize(mul) {
      const base = parseFloat(this.baseBet || "0");
      const sm = this.streakMultiplier / 100;
      return (base * (mul / 100) * sm).toFixed(4);
    },

    async refreshData() {
      if (!this.provider) return;
      try {
        const lot = getLotteryContract(this.provider);
        const [bet, bal, jp, gc] = await Promise.all([
          lot.betAmount(), lot.getBalance(), lot.jackpotPool(), lot.guaranteeCount(),
        ]);
        this.baseBet = ethers.utils.formatEther(bet);
        this.contractBalance = parseFloat(ethers.utils.formatEther(bal)).toFixed(4);
        this.jackpotPool = jp.toString();
        this.guaranteeCount = gc.toNumber ? gc.toNumber() : Number(gc);
        if (this.address) {
          const [eb, s, sm, pp, re] = await Promise.all([
            lot.getEffectiveBet(this.address),
            lot.getStreak(this.address),
            lot.getStreakMultiplier(this.address),
            lot.getPendingPrize(this.address),
            lot.getReferralEarnings(this.address),
          ]);
          this.effectiveBet = ethers.utils.formatEther(eb);
          this.currentStreak = s.toNumber ? s.toNumber() : Number(s);
          this.streakMultiplier = sm.toNumber ? sm.toNumber() : Number(sm);
          this.pendingAmount = pp;
          this.refEarningsRaw = re;
        } else {
          this.effectiveBet = this.baseBet;
        }
      } catch (e) { console.error("refresh:", e); }
    },

    setupEvents() {
      if (!this.provider) return;
      const lot = getLotteryContract(this.provider);
      lot.removeAllListeners();

      lot.on("GamePlayed", (reqId, player) => {
        this.events.unshift({ id: ++evtId, type: "play", player });
      });

      lot.on("GameResult", (player, tierIdx, baseMul, streakMul, prize, isJackpot) => {
        const ti = typeof tierIdx === "number" ? tierIdx : tierIdx.toNumber ? tierIdx.toNumber() : Number(tierIdx);
        const won = (baseMul > 0 || isJackpot);
        const tierName = isJackpot ? "ДЖЕКПОТ" : (TIER_NAMES[ti] || "Приз");
        const bm = typeof baseMul === "number" ? baseMul : baseMul.toNumber ? baseMul.toNumber() : Number(baseMul);
        const sm = typeof streakMul === "number" ? streakMul : streakMul.toNumber ? streakMul.toNumber() : Number(streakMul);

        this.events.unshift({
          id: ++evtId, type: "result", player, won, isJackpot, tierName,
          prize: ethers.utils.formatEther(prize),
        });

        if (player.toLowerCase() === this.address?.toLowerCase()) {
          this.lastResult = {
            won, isJackpot, tierName,
            prize: ethers.utils.formatEther(prize),
            baseMultiplier: (bm / 100).toFixed(1) + "x",
            streakMul: (sm / 100).toFixed(2) + "x",
          };
          this.playing = false;
          this.resultDialog = true;
          if (won) { this.showConfetti = true; setTimeout(() => { this.showConfetti = false; }, 4000); }
          this.refreshData();
          this.refreshBalance();
        }
      });
    },

    async playGame() {
      if (!this.signer) return;
      this.playing = true;
      try {
        const lot = getLotteryContract(this.signer);
        const eb = await lot.getEffectiveBet(this.address);
        const refParam = new URLSearchParams(window.location.search).get("ref") || ethers.constants.AddressZero;
        const tx = await lot.playGame(refParam, { value: eb });
        await tx.wait();
      } catch (e) {
        this.playing = false;
        this.errorMsg = e.reason || e.data?.message || e.message || "Ошибка";
        this.errorSnackbar = true;
      }
    },

    async claimPrize() {
      this.claiming = true;
      try {
        const tx = await getLotteryContract(this.signer).claimPrize();
        await tx.wait();
        this.successMsg = "Приз получен!";
        this.successSnackbar = true;
        this.refreshData(); this.refreshBalance();
      } catch (e) { this.errorMsg = e.reason || e.message; this.errorSnackbar = true; }
      finally { this.claiming = false; }
    },

    async claimRefEarnings() {
      this.claimingRef = true;
      try {
        const tx = await getLotteryContract(this.signer).claimReferralEarnings();
        await tx.wait();
        this.successMsg = "Реферальные выведены!";
        this.successSnackbar = true;
        this.refreshData(); this.refreshBalance();
      } catch (e) { this.errorMsg = e.reason || e.message; this.errorSnackbar = true; }
      finally { this.claimingRef = false; }
    },

    copyRefLink() {
      navigator.clipboard.writeText(this.referralLink);
      this.successMsg = "Скопировано!";
      this.successSnackbar = true;
    },
  },
  mounted() {
    this.refreshData(); this.setupEvents();
    this._interval = setInterval(() => this.refreshData(), 8000);
  },
  beforeDestroy() {
    clearInterval(this._interval);
    try { getLotteryContract(this.provider).removeAllListeners(); } catch (e) { /* */ }
  },
};
</script>

<style scoped>
.jackpot-banner {
  border: 1px solid rgba(255, 214, 0, 0.2) !important;
  background: rgba(255, 214, 0, 0.04) !important;
}
.jackpot-amount {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--gold);
  text-shadow: 0 0 30px rgba(255, 214, 0, 0.3);
  animation: glow-pulse 3s infinite;
}
.play-btn {
  background: linear-gradient(135deg, #7C4DFF, #E040FB) !important;
  border-radius: 16px !important;
  height: 64px !important;
  font-weight: 800 !important;
  text-transform: none !important;
  box-shadow: 0 6px 30px rgba(124, 77, 255, 0.4) !important;
  transition: transform .2s ease, box-shadow .3s ease !important;
}
.play-btn:hover { transform: scale(1.02); box-shadow: 0 8px 40px rgba(224, 64, 251, 0.5) !important; }
.play-btn:active { transform: scale(0.98); }
.event-item { background: rgba(255,255,255,.03); border-radius: 10px; border: 1px solid rgba(255,255,255,.04); transition: background .2s; }
.event-item:hover { background: rgba(255,255,255,.06); }
.event-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-pending { background: #2196F3; box-shadow: 0 0 6px rgba(33,150,243,.5); }
.dot-win { background: #00E676; box-shadow: 0 0 6px rgba(0,230,118,.5); }
.dot-lose { background: #FF5252; box-shadow: 0 0 6px rgba(255,82,82,.3); }
.dot-jackpot { background: #FFD600; box-shadow: 0 0 10px rgba(255,214,0,.6); animation: glow-pulse 1.5s infinite; }
.result-card { border-radius: 24px !important; overflow: hidden; }
.result-win { border-color: rgba(0,230,118,.25) !important; box-shadow: 0 0 60px rgba(0,230,118,.15) !important; }
.result-win .result-icon { animation: coin-bounce .8s ease both; }
.result-lose { border-color: rgba(255,82,82,.2) !important; }
.result-lose .result-icon { animation: shake .5s ease; }
</style>
