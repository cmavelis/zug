import { ref, watch, onMounted } from 'vue';
import { useClerk } from '@clerk/vue';

const clerkToken = ref('');
const clerkUsername = ref('');

export function useClerkUser() {
  const clerk = useClerk();

  onMounted(() => {
    if (!clerk.value) return;
    clerk.value.addListener(async ({ session }) => {
      const token = await session?.getToken();
      if (token) {
        clerkToken.value = token;
      }
    });
    const username = clerk.value.session?.user.username;
    if (username) {
      clerkUsername.value = username;
    }
  });

  watch(
    clerk,
    (newClerk) => {
      if (!newClerk) return;
      newClerk.addListener(async ({ session }) => {
        const token = await session?.getToken();
        if (token) {
          clerkToken.value = token;
        }
      });
      const username = newClerk.session?.user.username;
      if (username) {
        clerkUsername.value = username;
      }
    },
    { immediate: true },
  );

  return {
    clerkToken,
    clerkUsername,
  };
}
