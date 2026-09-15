// The app's one way to validate a form: a schema of rules per field name.
export function validateForm(form, schema) {
  const errors = {};
  for (const [name, rules] of Object.entries(schema)) {
    const value = form.elements[name]?.value ?? '';
    if (rules.required && value.trim() === '') errors[name] = 'Required';
    else if (rules.pattern && !rules.pattern.test(value)) errors[name] = rules.message ?? 'Invalid';
  }
  return errors;
}

export function showFieldErrors(form, errors) {
  for (const el of form.querySelectorAll('.field__error')) el.textContent = errors[el.dataset.for] ?? '';
}
