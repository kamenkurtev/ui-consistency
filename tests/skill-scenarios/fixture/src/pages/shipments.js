import { showError } from '../shared/notify.js';

export function render() {
  return `
    <main class="page stack-3">
      <header class="toolbar">
        <h1>Shipments</h1>
        <button class="btn btn--ghost" type="button" data-action="export">Export</button>
        <span class="badge--muted">beta</span>
      </header>
      <section data-role="list"></section>
      <p style="color: #c62828; margin-top: 13px;" data-role="warning"></p>
      <form class="stack-2" data-role="create">
        <label class="field">Name <input name="name"><span class="field__error" data-for="name"></span></label>
        <label class="field">Email <input name="email"><span class="field__error" data-for="email"></span></label>
        <button class="btn btn--primary btn--large" type="submit" style="background: var(--color-accent)">Save</button>
      </form>
    </main>`;
}

export async function onSubmit(form) {
  const email = form.elements.email.value;
  if (!email.includes('@')) {
    alert('Enter an email');
    return;
  }
  const response = await fetch('/api/shipments', { method: 'POST', body: new FormData(form) });
  if (!response.ok) alert('Could not save.');
}
