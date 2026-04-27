export type NotifyType = 'success' | 'error' | 'info';

export const notify = (message: string, type: NotifyType = 'info') => {
  window.dispatchEvent(
    new CustomEvent('app-notify', {
      detail: { message, type },
    }),
  );
};

