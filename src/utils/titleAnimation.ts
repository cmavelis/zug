const originalDocumentTitle = document.title;
let interval1: string | number | NodeJS.Timeout | undefined,
  interval2: string | number | NodeJS.Timeout | undefined;

export const startTitleNotification = (newTitle: string) => {
  interval1 = setInterval(() => {
    document.title = newTitle;
  }, 2500);
  setTimeout(() => {
    interval2 = setInterval(() => {
      document.title = originalDocumentTitle;
    }, 2500);
  }, 1250);
};

export const stopTitleNotification = () => {
  clearInterval(interval1);
  clearInterval(interval2);
};
