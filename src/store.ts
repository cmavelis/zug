import { reactive } from 'vue';
import { getUserInStorage } from '@/utils/auth';

export const store = reactive({
  isDebug: false,
  setIsDebug(arg = true) {
    this.isDebug = arg;
  },
  zugToken: getUserInStorage()?.authToken,
  setZugToken(arg: string | undefined) {
    this.zugToken = arg;
  },
  zugUsername: getUserInStorage()?.userID,
  setZugUsername(arg: string | undefined) {
    this.zugUsername = arg;
  },
});
