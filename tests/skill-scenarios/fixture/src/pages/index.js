// Chooses which page renders for the current route, renders it, and hands the
// form back to the page that drew it.
import * as orders from './orders.js';
import * as invoices from './invoices.js';
import * as customers from './customers.js';
import * as shipments from './shipments.js';

const pages = { orders, invoices, customers, shipments };

export function mountRoute(route, root) {
  const page = pages[route] ?? orders;
  root.innerHTML = page.render();

  const form = root.querySelector('form[data-role=create]');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      page.onSubmit(form);
    });
  }
}
