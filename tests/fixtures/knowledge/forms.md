# Forms

## Form layout

Forms lay out inside `<FormLayout>`, which arranges fields by weight. Do not
rearrange the fields themselves — the layout decides the order from the weights
so that every form in the product reads the same way.

## Form fields

A field is `<FormField>`, never a bare `<TextField>`. `FormField` carries the
label, the error slot and the spacing that the layout depends on.

## Form actions

Submit and cancel go in `<FormActions>` at the end of the form. **Never** put a
submit button inline between fields.
