/**
 * How a project's names carry a role without anybody declaring one.
 *
 * Its own module because both the family reader and the usage observer need it,
 * and the observer cannot import the reader — the reader imports the observer.
 */
/**
 * The last word of a component's name, in either spelling a project uses.
 *
 * `CustomerInvoicesGrid` → `Grid`, and `app-customer-invoices-grid` → `grid`.
 * A custom element is as much a component as a capitalised one, and reading
 * only the capitalised spelling left every template dialect with nothing to say
 * (#249).
 */
export const trailingWord = (name: string): string | null => {
  const words = name.includes('-') ? name.split('-') : name.match(/[A-Z][a-z0-9]*/g);
  const last = words?.[words.length - 1];
  return last === undefined || last.length < 3 ? null : last;
};
