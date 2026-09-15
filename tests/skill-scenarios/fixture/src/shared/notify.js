// The app's one way to tell the user a request failed.
export function showError(message) {
  const region = document.querySelector('[data-role="notifications"]');
  region.textContent = message;
  region.hidden = false;
}
