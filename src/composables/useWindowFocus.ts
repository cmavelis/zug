import { ref } from 'vue';

export const useWindowFocus = () => {
  const windowHasFocus = ref(document.hasFocus());

  setInterval(function () {
    windowHasFocus.value = document.hasFocus();
  }, 500);

  return windowHasFocus;
};
