import { validateForm, showFieldErrors } from '../shared/validate.js';
import { showError } from '../shared/notify.js';

const schema = { name: { required: true }, email: { required: true, pattern: /@/, message: 'Enter an email' } };

export function render() {
  return `
    <main class="page stack-3">
      <header class="toolbar">
        <h1>Orders</h1>
        <button class="btn btn--ghost" type="button" data-action="export">Export</button>
      </header>
      <section data-role="list"></section>
      <form class="stack-2" data-role="create">
        <label class="field">Name <input name="name"><span class="field__error" data-for="name"></span></label>
        <label class="field">Email <input name="email"><span class="field__error" data-for="email"></span></label>
        <button class="btn btn--primary btn--block" type="submit">Save</button>
      </form>
    </main>`;
}

export async function onSubmit(form) {
  const errors = validateForm(form, schema);
  showFieldErrors(form, errors);
  if (Object.keys(errors).length > 0) return;
  const response = await fetch('/api/orders', { method: 'POST', body: new FormData(form) });
  if (!response.ok) showError('Could not save. Try again.');
}
