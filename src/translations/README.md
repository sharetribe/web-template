# Marketplace texts

Websites can contain a couple of different types of text content: longer texts (like articles) and
smaller pieces of UI texts (like button labels and error messages). This directory is about the
latter - short UI texts that different components of the app display.

Sharetribe Web template uses React Intl library to make short UI texts dynamic. This allows you to
modify them without modifying every component directly. We call these messages **marketplace
texts**.

They are a collection of key value pairs, where the key is a unique identifier for the message and
it contains a reference to the component that displays the message.  
`"TopbarSearchForm.placeholder": "Search listings…",`

This allows you to brand your marketplace with your own texts.  
`"TopbarSearchForm.placeholder": "Search bicycles…",`

And also change the language of the marketplace.  
`"TopbarSearchForm.placeholder": "Buscar anuncios…",`

You can learn more about Marketplace texts at
https://www.sharetribe.com/docs/concepts/marketplace-texts/.

Marketplace texts are a part of Sharetribe texts, along wiht Email texts. All Sharetribe texts added
to newly created Sharetribe marketplaces can be found in the
https://github.com/sharetribe/sharetribe-texts/ public repository.

## Hosted marketplace texts

Hosted marketplace texts can be edited in Sharetribe Console at Build > Content > Marketplace texts.

This template app tries to fetch marketplace texts from hosted assets
(`/content/translations.json`). If that file is not available (not created in Console), or if the
file doesn't contain all the translations, the template uses fallback translations from **en.json**
file.

## Translations files on this directory

This directory contains translated marketplace texts for different languages. We'll introduce new
languages into this directory one by one.

The only file that is in active use, by default, is the **en.json** file. It is used as a fallback
for those translations that might be missing from the hosted translations.json file.

Note: all these files use generic terms like "listing" and "order". You should consider changing
those to something closer to your own marketplace concept. E.g. Bicycle rental marketplace might
want to use "bike" instead of "listing".

Other files in this directory might get updates a bit delayed fashion, as they are manually
translated.

If you develop with some other language than English, you should consider changing the fallback file
to the language you're using. This means that while you create new components, you need to keep the
fallback file always up to date with keys that are used in your codebase.

## Custom language

In case you don't see a preferred language, you could create it on your own here. Then you need to
check _src/app.js_ file for steps on how to take the new translation file into use.

## Multiple languages

By default, this template app supports only one language. If you want to support multiple languages,
you need to customize the app to work with multiple languages. I.e. you need to figure out how to
handle the following:

- Do you want to support multiple languages for user-generated content (UGC) like listings, reviews,
  etc.?
- How to support server-side rendering (SSR)? => The URL needs to hold information about the
  selected language
- Do you need to keep track of the preferred language per user?
- What is the fallback translation, if the different language files are not up to date

Note: Currently, hosted assets supports only one marketplace texts file:
`/content/translations.json`
