import { useToast } from './useToast';

export const useErrorHandler = () => {
  const toast = useToast();

  const handleError = (error: any, errorMessage: string) => {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: errorMessage });
  };
  return { handleError };
};
