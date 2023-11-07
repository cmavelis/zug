import { reactive } from 'vue';
import { getUserInStorage } from '@/utils/auth';

export const store = reactive({
  isDebug: false,
  setIsDebug(arg = true) {
    this.isDebug = arg;
  },
  zugToken: getUserInStorage()?.authToken,
  setZugToken(arg: string) {
    this.zugToken = arg;
  },
  zugUsername: getUserInStorage()?.username,
  setZugUsername(arg: string) {
    this.zugUsername = arg;
  },
});
