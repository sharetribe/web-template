This directory contains the configuration for building and testing the web application.

NOTE: Be careful when modifying these. Modifications might lead to behavior that are difficult to
debug. So, you need to know what you are doing.

## Background

This setup originates from a fork of
[Create React App](https://github.com/facebook/create-react-app) (CRA). The fork,
sharetribe-scripts, included the following changes:

- Server-side rendering
- Code-splitting
- Custom CSS setup

## Usage

The configuration is used by the following scripts:

- scripts/build.js
- scripts/build-server.js
- scripts/start.js
- scripts/test.js

## Extra notes

The private
[postcss-apply](https://github.com/sharetribe/create-react-app/tree/master/packages/react-scripts/postcss/postcss-apply)
plugin was not included anymore. It was fallback setup for a deprecation on a past version of the
sharetribe-scripts.

We have included inlined and updated versions of the original files from Create React App. These are
located in the following directories:

- babel-preset-react-app
- eslint-config-react-app
- react-dev-utils

Currently, Sharetribe Web Template does not use eslint. You could expand this rough config to your
own needs.

CRA also contains support for other features that are not used in this project. E.g. TypeScript.
Most of these are included in some form. (Note: if you want to use Tailwind, you need to figure out
the best way to do that.
[It was not included.](https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js#L161-L173))
