# Translations files for Microcopy

We'll introduce new languages into this directory one by one. As the name suggest,
**defaultMicrocopy.json** file is the default microcopy file and it hold generic terms like "item"
instead of themed translations like "bike". The **en.json** is currently holding Biketribe-themed
translations. Other translation files are added and updated after changes have been reviewed by
translators.

**Note**: we might drop the Biketribe themed translation file and start using en.json as the default
file.

## Hosted microcopy vs default translations

By default, this template app tries to fetch microcopy from hosted assets (translations.json). If
that file is not available (not created in Console), or if the file doesn't contain all the
translations, the template uses fallback translations from defaultMicrocopy.json file.

## Custom language

In case, you don't see a preferred language, you could create it on your own here. Then you need to
check _src/app.js_ file for steps on how to take the new translation file into use.

Read more about Microcopy from Docs: https://www.sharetribe.com/docs/
