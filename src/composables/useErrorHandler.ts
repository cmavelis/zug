import { useToast } from './useToast';

export const useErrorHandler = () => {
  const toast = useToast();

  const handleError = (error: Error, errorMessage: string) => {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: errorMessage });
  };
  return { handleError };
};
