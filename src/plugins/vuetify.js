import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: "#7C4DFF",
        secondary: "#E040FB",
        accent: "#00E5FF",
        success: "#00E676",
        error: "#FF5252",
        warning: "#FFD600",
        info: "#2196F3",
        background: "#0f0e17",
      },
    },
    options: { customProperties: true },
  },
  icons: { iconfont: "mdi" },
});
