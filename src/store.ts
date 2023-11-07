import { reactive } from 'vue';
import { getTokenInStorage } from '@/utils/auth';

export const store = reactive({
  isDebug: false,
  setIsDebug(arg = true) {
    this.isDebug = arg;
  },
  zugToken: getTokenInStorage(),
  setZugToken(arg: string) {
    this.zugToken = arg;
  },
});
