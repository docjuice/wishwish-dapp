import { ethers } from "ethers";

export default {
  namespaced: true,
  state: () => ({
    provider: null,
    signer: null,
    address: null,
    chainId: null,
    balance: null,
    connected: false,
  }),

  getters: {
    shortAddress(state) {
      if (!state.address) return "";
      return state.address.slice(0, 6) + "..." + state.address.slice(-4);
    },
    isConnected(state) {
      return state.connected;
    },
  },

  mutations: {
    SET_PROVIDER(state, provider) {
      state.provider = provider;
    },
    SET_SIGNER(state, signer) {
      state.signer = signer;
    },
    SET_ADDRESS(state, address) {
      state.address = address;
    },
    SET_CHAIN_ID(state, chainId) {
      state.chainId = chainId;
    },
    SET_BALANCE(state, balance) {
      state.balance = balance;
    },
    SET_CONNECTED(state, connected) {
      state.connected = connected;
    },
    RESET(state) {
      state.provider = null;
      state.signer = null;
      state.address = null;
      state.chainId = null;
      state.balance = null;
      state.connected = false;
    },
  },

  actions: {
    async connect({ commit, dispatch }) {
      if (!window.ethereum) {
        throw new Error("MetaMask не найден. Установите расширение MetaMask.");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      commit("SET_PROVIDER", provider);
      commit("SET_SIGNER", signer);
      commit("SET_ADDRESS", address);
      commit("SET_CHAIN_ID", network.chainId);
      commit("SET_BALANCE", ethers.utils.formatEther(balance));
      commit("SET_CONNECTED", true);

      window.ethereum.on("accountsChanged", () => dispatch("connect"));
      window.ethereum.on("chainChanged", () => window.location.reload());
    },

    async refreshBalance({ state, commit }) {
      if (!state.provider || !state.address) return;
      const balance = await state.provider.getBalance(state.address);
      commit("SET_BALANCE", ethers.utils.formatEther(balance));
    },

    disconnect({ commit }) {
      commit("RESET");
    },
  },
};
