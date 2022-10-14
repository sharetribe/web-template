# Transaction process

These are the transaction processes that the Flex Template for Web is designed to work with by
default. The `process.edn` file describes the process flow while the `templates` folder contains
notification messages that are used by the process.

## Check active processes from Console

These are visible here only as a reference. The active transaction processes you need to check from
Console or
[using Flex CLI](https://www.sharetribe.com/docs/how-to/edit-transaction-process-with-flex-cli/)

In addition, the client app needs to understand

## Product process

Orders in the process use stock management. Pricing uses privileged transitions and the
[privileged-set-line-items](https://www.sharetribe.com/docs/references/transaction-process-actions/#actionprivileged-set-line-items)
action.

## Booking process

Orders in the process use time-based availability management and showed booking times are showed in
listing's time zone. Pricing uses privileged transitions and the
[privileged-set-line-items](https://www.sharetribe.com/docs/references/transaction-process-actions/#actionprivileged-set-line-items)
action.
