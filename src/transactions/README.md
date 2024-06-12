# Working with transaction processes

This directory contains the different transaction processes that this client app can handle. You
should note that these client-app-related processes should match with actual transaction processes
that are visible in Sharetribe Console.

There's a bit of duplication involved with transaction processes. If you decide to customize
existing transaction processes or create a unique process, you need to define the process so that
the Sharetribe backend understands it. You can use Sharetribe CLI to push the process to your
marketplace environment.

Read more about transaction processes:  
https://www.sharetribe.com/docs/concepts/transaction-process/

> The default processes are referenced also in the directory: _../../ext/transaction-processes_.

In addition to the process that is saved to the Sharetribe platform, you also need to add the new or
modified process here. This directory guides how this web app renders different pages - and the app
needs to have knowledge about what happens after each transition in the process.

Read more about how to take new or modified transaction processes into use in this template.  
https://www.sharetribe.com/docs/how-to/change-transaction-process-in-ftw/

The starting point to take the new process into use in your client app is to define a new process
graph in this directory and take it into use in transaction.js. After that, you need to go through
all the files that import the transaction.js file and check if those components need to be
customized to work with your customized process graph.

## [transaction.js](transaction.js)

This file is the main file and it works as a utility module imported on different presentational and
container components as well as with those \*.duck.js files that fetch data from Marketplace API.

As a summary: this file defines what unit types are expected in different processes and it exports
the different transaction processes and some functions that can be used in those containers and
components that need to make decisions based on the currently used transaction process.

## [transactionProcessBooking.js](transactionProcessBooking.js)

This file defines the process graph of _default-booking_ for the web app.

## [transactionProcessPurchase.js](transactionProcessPurchase.js)

This file defines the process graph of _default-purchase_ for the web app.

## [transactionProcessInquiry.js](transactionProcessInquiry.js)

This file defines the process graph of _default-inquiry_ for the web app. The default-inquiry
process is a very simple transaction process without payments. Its job is to make it possible for
customers to contact and start messaging with providers. Since Stripe is not available for every
country, this process could be used instead.

Note: you need to figure out the monetization model separately as payments (and commissions) don't
happen through the platform with this process.

## [../../ext/transaction-processes](../../ext/transaction-processes/README.md)

These files reference the actual transaction processes that are available by default on each
marketplace.

> Note: changing these files or email templates doesn't change the actual processes in your
> marketplace environments unless you use Sharetribe CLI to actually update the processes listed in
> the Console.
