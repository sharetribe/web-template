# User config

User types and custom user fields. Console edits live in `users/user-types.json` and
`users/user-fields.json` and land on `config.user`.

By default, hosted assets replace built-ins entirely — empty hosted data means empty `userTypes` /
`userFields`, not a fallback to [`defaultUser.js`](./defaultUser.js). Built-ins are only mixed in
when debugging merge is on (`mergeDefaultTypesAndFieldsForDebugging`).

## `config.user` shape

```js
{
  userTypes: [
    {
      userType, // hosted id
      label,
      roles?, // { provider, customer }; missing → app treats both as true
      accountLinksVisibility?, // { postListings, payoutDetails, paymentMethods }
      defaultUserFields?, // toggles; app mainly uses displayName, phoneNumber
      displayNameSettings?, // { displayInSignUp, required }
      phoneNumberSettings?, // { displayInSignUp, required }
      referralSources?, // [{ label, parameter }] URL params stored in private data
    },
    // ...
  ],
  userFields: [
    {
      key,
      scope, // 'public' | 'private' | 'protected' | 'metadata' (default 'public')
      schemaType, // 'enum' | 'multi-enum' | 'text' | 'long' | 'boolean'
      enumOptions?, // [{ option, label }] for enum / multi-enum
      numberConfig?, // { minimum, maximum } for long
      showConfig: {
        label,
        displayInProfile?, // default true
        unselectedOptions?, // default true
      },
      saveConfig: {
        label,
        isRequired?, // hosted `required` → isRequired; default true
        displayInSignUp?, // default true
        placeholderMessage?,
        requiredMessage?,
      },
      userTypeConfig?: {
        limitToUserTypeIds, // true = only for listed types; false = all types
        userTypeIds?, // type ids when limited; unknown ids stripped, none left → field dropped
      },
      helpText?, // shown under the input on signup / profile edit forms
    },
    // ...
  ],
}
```

## When something is wrong

Invalid user types are dropped (missing label, bad id, duplicates). Invalid user fields are dropped
too (bad key/scope/schemaType, enum options, show/save config, or `userTypeConfig` limited to
unknown types). Does not trigger MaintenanceMode.
