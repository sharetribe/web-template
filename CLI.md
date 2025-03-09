# Sharetribe CLI

## Update config

```
flex-cli login
flex-cli process push --path ext/transaction-processes/default-purchase --process default-purchase -m neshto
flex-cli process update-alias --process=default-purchase --alias=release-1 --version 2 -m neshto
```

## Other samples

```

flex-cli process pull --process default-booking --version 1 --path process -m neshto-test
flex-cli process push --path default-purchase --process default-purchase -m neshto-test
flex-cli process --process default-purchase -m neshto-test
flex-cli process update-alias --process=default-purchase --alias=release-1 --version 3 -m neshto-dev
flex-cli process list --process default-purchase -m neshto-dev
```
