# Translations files for Microcopy

We'll introduce new languages into this directory one by one. The **en.json** is the default
microcopy file, and other translation files are added and updated after changes have been reviewed
by translators.

## Hosted microcopy vs en.json

By default, this template app tries to fetch microcopy from hosted assets (translations.json). If
that file is not available (not created in Console), or if the file doesn't contain all the
translations, the template uses fallback translations from en.json file.

## Custom language

In case, you don't see a preferred language, you could create it on your own here. Then you need to
check _src/app.js_ file for steps on how to take the new translation file into use.

Read more about Microcopy from Docs: https://www.sharetribe.com/docs/
