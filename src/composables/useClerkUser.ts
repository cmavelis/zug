import { ref, watch, onMounted } from 'vue';
import { useClerk } from '@clerk/vue';

const clerkUsername = ref('');
// this composable runs in many components, but only needs one listener
let subscribedClerk: unknown = null;

export function useClerkUser() {
  const clerk = useClerk();

  watch(
    clerk,
    (newClerk) => {
      if (!newClerk || newClerk === subscribedClerk) return;
      subscribedClerk = newClerk;
      newClerk.addListener(({ session }) => {
        const username = session?.user.username;
        if (username) {
          clerkUsername.value = username;
        }
      });
      const username = newClerk.session?.user.username;
      if (username) {
        clerkUsername.value = username;
      }
    },
    { immediate: true },
  );

  // Clerk tokens expire after 60s, so get one per request rather than storing
  // it. Clerk caches the token and refreshes it when needed.
  const getClerkToken = async () =>
    (await clerk.value?.session?.getToken()) ?? null;

  return {
    clerkUsername,
    getClerkToken,
  };
}
