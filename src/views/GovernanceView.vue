<template>
  <div>
    <v-row class="mb-4">
      <!-- Token stats -->
      <v-col cols="12" sm="4" class="anim-fade-in-up">
        <div class="glass-card pa-5">
          <div class="d-flex align-center mb-3">
            <v-icon color="secondary" class="mr-2">mdi-coin</v-icon>
            <span class="text-subtitle-2 font-weight-bold white--text">WISH Токен</span>
          </div>
          <div class="d-flex justify-space-between mb-4">
            <div>
              <div class="stat-value gradient-text">{{ tokenBalance }}</div>
              <div class="stat-label">Баланс</div>
            </div>
            <div class="text-right">
              <div class="stat-value" style="color: var(--green-bright)">{{ votingPower }}</div>
              <div class="stat-label">Голоса</div>
            </div>
          </div>
          <v-btn
            small
            depressed
            block
            class="glow-btn"
            @click="delegateToSelf"
            :disabled="!isConnected"
          >
            <v-icon left small>mdi-account-check</v-icon>
            Делегировать себе
          </v-btn>
        </div>
      </v-col>

      <!-- Create proposal -->
      <v-col cols="12" sm="8" class="anim-fade-in-up" style="animation-delay: 0.1s">
        <div class="glass-card pa-5">
          <div class="d-flex align-center mb-4">
            <v-icon color="secondary" class="mr-2">mdi-file-document-edit-outline</v-icon>
            <span class="text-subtitle-2 font-weight-bold white--text">Новое предложение</span>
          </div>

          <v-select
            v-model="proposalAction"
            :items="actionOptions"
            label="Действие"
            dense
            outlined
            dark
            hide-details
            class="mb-3"
          />

          <v-text-field
            v-if="proposalAction === 'setLotteryPrice'"
            v-model="actionValue"
            label="Новая цена (ETH)"
            dense outlined dark hide-details type="number" step="0.0001" class="mb-3"
          />
          <v-text-field
            v-if="proposalAction === 'setPrizeAmountInWei'"
            v-model="actionValue"
            label="Новый приз (ETH)"
            dense outlined dark hide-details type="number" step="0.0001" class="mb-3"
          />
          <v-text-field
            v-if="proposalAction === 'setWinChance'"
            v-model="actionValue"
            label="Шанс выигрыша (0-100)"
            dense outlined dark hide-details type="number" min="0" max="100" class="mb-3"
          />
          <v-text-field
            v-if="proposalAction === 'setCallbackGasLimit'"
            v-model="actionValue"
            label="Gas Limit"
            dense outlined dark hide-details type="number" class="mb-3"
          />
          <div v-if="proposalAction === 'withdraw'">
            <v-text-field v-model="withdrawAddress" label="Адрес получателя" dense outlined dark hide-details class="mb-3" />
            <v-text-field v-model="actionValue" label="Сумма (ETH)" dense outlined dark hide-details type="number" step="0.001" class="mb-3" />
          </div>

          <v-text-field
            v-model="proposalDescription"
            label="Описание"
            dense outlined dark hide-details class="mb-4"
          />

          <v-btn
            depressed
            class="glow-btn"
            :loading="proposing"
            :disabled="!isConnected || !proposalAction"
            @click="createProposal"
          >
            <v-icon left>mdi-send</v-icon>
            Создать предложение
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Proposals -->
    <div class="glass-card pa-5 anim-fade-in-up" style="animation-delay: 0.2s">
      <div class="d-flex align-center mb-4">
        <v-icon color="info" class="mr-2">mdi-format-list-checks</v-icon>
        <span class="text-subtitle-1 font-weight-bold white--text">Предложения</span>
        <v-spacer />
        <v-btn icon small @click="loadProposals">
          <v-icon small>mdi-refresh</v-icon>
        </v-btn>
      </div>

      <div v-if="proposals.length === 0" class="text-center pa-8">
        <v-icon size="48" style="opacity: 0.15">mdi-vote-outline</v-icon>
        <p class="caption mt-3" style="color: var(--text-secondary)">
          Предложений пока нет.
        </p>
      </div>

      <transition-group name="list" tag="div">
        <div
          v-for="p in proposals"
          :key="p.id"
          class="proposal-card mb-3 pa-4"
        >
          <!-- Header -->
          <div class="d-flex align-center mb-3">
            <v-chip
              x-small
              :color="stateColor(p.state)"
              dark
              class="mr-3 font-weight-bold"
            >
              {{ stateName(p.state) }}
            </v-chip>
            <span class="body-2 white--text font-weight-medium">{{ p.description }}</span>
          </div>

          <!-- State stepper -->
          <div class="state-stepper d-flex align-center mb-3">
            <div
              v-for="(step, idx) in stateSteps"
              :key="idx"
              class="step-item d-flex align-center"
            >
              <div
                class="step-dot"
                :class="{
                  'step-done': stepCompleted(p.state, idx),
                  'step-active': stepActive(p.state, idx),
                }"
              />
              <span class="step-label caption ml-1 mr-3">{{ step }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-flex flex-wrap" style="gap: 8px">
            <v-btn
              small depressed color="success"
              :disabled="toNum(p.state) !== 1 || !isConnected"
              :loading="voting"
              @click="vote(p.id, 1)"
            >
              <v-icon left small>mdi-thumb-up</v-icon> За
            </v-btn>
            <v-btn
              small depressed color="error"
              :disabled="toNum(p.state) !== 1 || !isConnected"
              :loading="voting"
              @click="vote(p.id, 0)"
            >
              <v-icon left small>mdi-thumb-down</v-icon> Против
            </v-btn>
            <v-btn
              small outlined dark
              :disabled="toNum(p.state) !== 1 || !isConnected"
              :loading="voting"
              @click="vote(p.id, 2)"
            >
              Воздержаться
            </v-btn>

            <v-divider vertical class="mx-1" style="opacity: 0.15" />

            <v-btn
              small depressed color="warning"
              :disabled="toNum(p.state) !== 4 || !isConnected"
              :loading="queueing"
              @click="queueProposal(p)"
            >
              <v-icon left small>mdi-tray-arrow-down</v-icon> В очередь
            </v-btn>
            <v-btn
              small depressed
              class="glow-btn"
              :disabled="toNum(p.state) !== 5 || !isConnected"
              :loading="executing"
              @click="executeProposal(p)"
            >
              <v-icon left small>mdi-play</v-icon> Выполнить
            </v-btn>

            <v-divider vertical class="mx-1" style="opacity: 0.15" />

            <v-btn small text @click="mineBlocks">
              <v-icon left small>mdi-pickaxe</v-icon> Mine блоки
            </v-btn>
            <v-btn small text @click="increaseTime">
              <v-icon left small>mdi-clock-fast</v-icon> +время
            </v-btn>
          </div>

          <div class="caption mt-2" style="color: var(--text-secondary)">
            Состояние: {{ stateName(toNum(p.state)) }} ({{ toNum(p.state) }})
          </div>
        </div>
      </transition-group>
    </div>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000" top>
      {{ snackbarMsg }}
    </v-snackbar>
  </div>
</template>

<script>
import { ethers } from "ethers";
import { mapState, mapGetters } from "vuex";
import {
  getLotteryContract,
  getGovernTokenContract,
  getGovernorContract,
  deployments,
} from "@/config/contracts";

const STATE_NAMES = ["Ожидание", "Голосование", "Отменено", "Отклонено", "Принято", "В очереди", "Истекло", "Выполнено"];
const STATE_COLORS = ["grey", "blue", "grey darken-1", "red", "green", "orange", "grey darken-2", "purple"];

export default {
  name: "GovernanceView",
  data() {
    return {
      tokenBalance: "0",
      votingPower: "0",
      proposalAction: null,
      actionValue: "",
      withdrawAddress: "",
      proposalDescription: "",
      proposing: false,
      voting: false,
      queueing: false,
      executing: false,
      proposals: [],
      snackbar: false,
      snackbarMsg: "",
      snackbarColor: "success",
      stateSteps: ["Pending", "Active", "Succeeded", "Queued", "Executed"],
      actionOptions: [
        { text: "Изменить цену билета", value: "setLotteryPrice" },
        { text: "Изменить приз", value: "setPrizeAmountInWei" },
        { text: "Изменить шанс выигрыша", value: "setWinChance" },
        { text: "Изменить Gas Limit VRF", value: "setCallbackGasLimit" },
        { text: "Вывести средства", value: "withdraw" },
      ],
    };
  },
  computed: {
    ...mapState("wallet", ["signer", "provider", "address"]),
    ...mapGetters("wallet", ["isConnected"]),
  },
  watch: {
    address() { this.loadTokenInfo(); },
  },
  methods: {
    stateName(s) { return STATE_NAMES[this.toNum(s)] || "?"; },
    stateColor(s) { return STATE_COLORS[this.toNum(s)] || "grey"; },

    toNum(val) {
      if (val == null) return 0;
      if (typeof val === "number") return val;
      if (val.toNumber) return val.toNumber();
      return Number(val);
    },

    stepCompleted(state, idx) {
      const s = this.toNum(state);
      const map = [0, 1, 4, 5, 7];
      return map[idx] !== undefined && s > map[idx];
    },
    stepActive(state, idx) {
      const s = this.toNum(state);
      const map = [0, 1, 4, 5, 7];
      return map[idx] === s;
    },

    showMsg(msg, color = "success") {
      this.snackbarMsg = msg;
      this.snackbarColor = color;
      this.snackbar = true;
    },

    async loadTokenInfo() {
      if (!this.provider || !this.address) return;
      try {
        const token = getGovernTokenContract(this.provider);
        const bal = await token.balanceOf(this.address);
        this.tokenBalance = parseFloat(ethers.utils.formatEther(bal)).toLocaleString("ru-RU", { maximumFractionDigits: 0 });
        const votes = await token.getVotes(this.address);
        this.votingPower = parseFloat(ethers.utils.formatEther(votes)).toLocaleString("ru-RU", { maximumFractionDigits: 0 });
      } catch (e) { console.error(e); }
    },

    async delegateToSelf() {
      if (!this.signer) return;
      try {
        const token = getGovernTokenContract(this.signer);
        const tx = await token.delegate(this.address);
        await tx.wait();
        this.showMsg("Голоса делегированы");
        this.loadTokenInfo();
      } catch (e) { this.showMsg(e.reason || e.message, "error"); }
    },

    buildCalldata() {
      const lottery = getLotteryContract(this.provider);
      const a = this.proposalAction;
      if (a === "setLotteryPrice") return lottery.interface.encodeFunctionData("setLotteryPrice", [ethers.utils.parseEther(this.actionValue || "0")]);
      if (a === "setPrizeAmountInWei") return lottery.interface.encodeFunctionData("setPrizeAmountInWei", [ethers.utils.parseEther(this.actionValue || "0")]);
      if (a === "setWinChance") return lottery.interface.encodeFunctionData("setWinChance", [parseInt(this.actionValue) || 0]);
      if (a === "setCallbackGasLimit") return lottery.interface.encodeFunctionData("setCallbackGasLimit", [parseInt(this.actionValue) || 200000]);
      if (a === "withdraw") return lottery.interface.encodeFunctionData("withdraw", [this.withdrawAddress || this.address, ethers.utils.parseEther(this.actionValue || "0")]);
      return null;
    },

    async createProposal() {
      if (!this.signer) return;
      this.proposing = true;
      try {
        const governor = getGovernorContract(this.signer);
        const calldata = this.buildCalldata();
        if (!calldata) throw new Error("Выберите действие");

        const targets = [deployments.lottery];
        const values = [0];
        const calldatas = [calldata];
        const description = this.proposalDescription || `Action: ${this.proposalAction}`;

        const tx = await governor.propose(targets, values, calldatas, description);
        const receipt = await tx.wait();

        const createdEvent = receipt.events.find(e => e.event === "ProposalCreated");
        const proposalId = createdEvent
          ? createdEvent.args.proposalId.toString()
          : receipt.events[0].args[0].toString();

        console.log("[Gov] Proposal created:", proposalId);

        this.proposals.unshift({
          id: proposalId,
          description, targets, values, calldatas,
          state: 0,
        });

        this.showMsg("Предложение создано! Нажмите 'Mine блоки' чтобы пройти voting delay.");
        this.proposalAction = null;
        this.actionValue = "";
        this.proposalDescription = "";
      } catch (e) {
        console.error("[Gov] createProposal error:", e);
        this.showMsg(e.reason || e.message, "error");
      }
      finally { this.proposing = false; }
    },

    async vote(proposalId, support) {
      if (!this.signer) return;
      this.voting = true;
      try {
        const governor = getGovernorContract(this.signer);
        const tx = await governor.castVote(proposalId, support);
        await tx.wait();
        const labels = { 0: "Против", 1: "За", 2: "Воздержался" };
        this.showMsg(`${labels[support]} — голос учтён!`);
        this.refreshProposalStates();
      } catch (e) { this.showMsg(e.reason || e.message, "error"); }
      finally { this.voting = false; }
    },

    async queueProposal(p) {
      if (!this.signer) return;
      this.queueing = true;
      try {
        const governor = getGovernorContract(this.signer);
        const tx = await governor.queue(p.targets, p.values, p.calldatas, ethers.utils.id(p.description));
        await tx.wait();
        this.showMsg("В очереди");
        this.refreshProposalStates();
      } catch (e) { this.showMsg(e.reason || e.message, "error"); }
      finally { this.queueing = false; }
    },

    async executeProposal(p) {
      if (!this.signer) return;
      this.executing = true;
      try {
        const governor = getGovernorContract(this.signer);
        const tx = await governor.execute(p.targets, p.values, p.calldatas, ethers.utils.id(p.description));
        await tx.wait();
        this.showMsg("Выполнено!");
        this.refreshProposalStates();
      } catch (e) { this.showMsg(e.reason || e.message, "error"); }
      finally { this.executing = false; }
    },

    async refreshProposalStates() {
      if (!this.provider) return;
      const governor = getGovernorContract(this.provider);
      for (let i = 0; i < this.proposals.length; i++) {
        const p = this.proposals[i];
        try {
          const raw = await governor.state(p.id);
          const val = this.toNum(raw);
          this.$set(this.proposals[i], "state", val);
          console.log(`[Gov] Proposal ${p.id.slice(0, 10)}... state=${val} (${this.stateName(val)})`);
        } catch (e) {
          console.error(`[Gov] state() error for ${p.id.slice(0, 10)}:`, e.reason || e.message);
        }
      }
    },

    loadProposals() { this.refreshProposalStates(); this.loadTokenInfo(); },

    async mineBlocks() {
      try {
        const rpc = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        const blockBefore = await rpc.getBlockNumber();
        for (let i = 0; i < 35; i++) await rpc.send("evm_mine", []);
        const blockAfter = await rpc.getBlockNumber();
        this.showMsg(`Добыто блоков: ${blockAfter - blockBefore} (${blockBefore} -> ${blockAfter})`);
        await this.refreshProposalStates();
      } catch (e) {
        console.error("[Gov] mineBlocks error:", e);
        this.showMsg(e.message, "error");
      }
    },

    async increaseTime() {
      try {
        const rpc = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        await rpc.send("evm_increaseTime", [120]);
        await rpc.send("evm_mine", []);
        this.showMsg("+120 секунд, +1 блок");
        await this.refreshProposalStates();
      } catch (e) {
        console.error("[Gov] increaseTime error:", e);
        this.showMsg(e.message, "error");
      }
    },
  },
  mounted() { this.loadTokenInfo(); },
};
</script>

<style scoped>
.proposal-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.proposal-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(124, 77, 255, 0.2);
}

.state-stepper {
  overflow-x: auto;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.step-done {
  background: var(--green-bright);
  box-shadow: 0 0 6px rgba(0, 230, 118, 0.4);
}

.step-active {
  background: var(--accent-purple);
  box-shadow: 0 0 8px rgba(124, 77, 255, 0.5);
  animation: pulse 2s infinite;
}

.step-label {
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
