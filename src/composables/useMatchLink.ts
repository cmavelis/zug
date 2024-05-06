import { useToast } from './useToast';

export const useMatchLink = (matchID: string) => {
  const { origin } = window.location;

  const toast = useToast();
  const showCopyMessage = (link: string) => {
    toast.add({
      severity: 'info',
      summary: 'Match link copied',
      detail: link,
      life: 4000,
    });
  };

  const copyLink = (args?: { query: { turn: string; step: string } }) => {
    let link = `${origin}/match/${matchID}`;
    const params = new URLSearchParams(args?.query);
    if (params.size) {
      link += `?${params}`;
    }
    navigator.clipboard.writeText(link).then(() => showCopyMessage(link));
  };
  return { copyLink };
};
