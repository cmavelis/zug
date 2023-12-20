import { useToast as usePrimeToast } from 'primevue/usetoast';
import { type ToastMessageOptions } from 'primevue/toast';

export const useToast = (defaultLife: number = 3000) => {
  const primeToast = usePrimeToast();
  return {
    ...primeToast,
    add: (message: ToastMessageOptions) => {
      primeToast.add({ life: defaultLife, ...message });
    },
  };
};
