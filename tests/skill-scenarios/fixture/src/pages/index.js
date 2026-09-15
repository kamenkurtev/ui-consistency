// Chooses which page renders for the current route.
import * as orders from './orders.js';
import * as invoices from './invoices.js';
import * as customers from './customers.js';
import * as shipments from './shipments.js';

const pages = { orders, invoices, customers, shipments };

export function renderRoute(route) {
  const page = pages[route] ?? orders;
  return page.render();
}
