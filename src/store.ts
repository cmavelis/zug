import { reactive } from 'vue';

export const store = reactive({
  isDebug: false,
  setIsDebug(arg = true) {
    this.isDebug = arg;
  },
});
