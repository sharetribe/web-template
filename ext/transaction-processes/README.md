# Transaction process

These are the transaction processes that the Sharetribe Web Template is designed to work with by
default. The `process.edn` file describes the process flow while the `templates` folder contains
notification messages that are used by the process.

## Check active processes from Console

These are visible here only as a reference. The active transaction processes you need to check from
Console or
[using Flex CLI](https://www.sharetribe.com/docs/how-to/edit-transaction-process-with-flex-cli/)

If you don't have these processes visible on Console, you need to add them there using Flex CLI.
[Tutorial: create a new transaction process](https://flex-docs-git-feat-docs-biketribe-sharetribe.vercel.app/tutorial/create-transaction-process/)

Pricing in these processes use privileged transitions and the
[privileged-set-line-items](https://www.sharetribe.com/docs/references/transaction-process-actions/#actionprivileged-set-line-items)
action.

## Purchase process

Orders in this process use stock management. If you are selling products, your listing type should
be configured to use this process.

## Booking process

Orders in this process use time-based availability management. The booking times are showed in
listing's time zone. By default, there are 3 unit types in use: 'hour', 'day', and 'night'. You need
to define these in your listing type configuration.

## Inquiry process

This process enables free messaging between customer and provider. Any payments etc. need to happen
face-to-face or somehow outside of the marketplace. The initial inquiry message is saved to the
protected data of the transaction.
