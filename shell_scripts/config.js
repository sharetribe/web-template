const inquirer = require('inquirer');
const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');

/**
 * If config script is running with flag --check only check if .env file exists.
 * Show error if .env file doesn't exist.
 *
 * When running the script without flag .env file is created.
 * User can fill in environment variables needed for running the application.
 *
 * If .env file already exists user can edit the values configured in the file.
 * Old values are used as default.
 *
 */

const run = () => {
  const hasEnvFile = fs.existsSync(`./.env`);

  if (process.argv[2] && process.argv[2] === '--check') {
    if (!hasEnvFile) {
      process.on('exit', code => {
        console.log(`

${chalk.bold.red(`You don't have required .env file!`)}

Some environment variables are required before starting Sharetribe Web Template. You can create the .env file and configure the variables by running ${chalk.cyan.bold(
          'yarn run config'
        )}

  `);
      });
      process.exit(1);
    }
  } else if (hasEnvFile) {
    console.log(`
${chalk.bold.green('.env file already exists!')}
Remember to restart the application after editing the environment variables! You can also edit environment variables by editing the .env file directly in your text editor.
    `);

    inquirer
      .prompt([
        {
          type: 'confirm',
          name: 'editEnvFile',
          message: 'Do you want to edit the .env file?',
          default: false,
        },
      ])
      .then(answers => {
        if (answers.editEnvFile) {
          const settings = findSavedValues();
          askQuestions(settings);
        }
      })
      .catch(err => {
        console.log(chalk.red(`An error occurred due to: ${err.message}`));
      });
  } else {
    inquirer
      .prompt([
        {
          type: 'confirm',
          name: 'createEmptyEnv',
          message: `Do you want to configure required environment variables now?
${chalk.dim(
  `If you don't set up variables now .env file is created based on .env-template file. The application will not work correctly without Sharetribe marketplace client ID, client secret, Stripe publishable API key and MapBox acces token.
We recommend setting up the required variables before starting the application!`
)}`,
          default: true,
        },
      ])
      .then(answers => {
        createEnvFile();
        if (answers.createEmptyEnv) {
          askQuestions();
        } else {
          showSuccessMessage();
        }
      })
      .catch(err => {
        console.log(chalk.red(`An error occurred due to: ${err.message}`));
      });
  }
};

/**
 * Questions for mandatory variables.
 * If some values already exist in the .env file use them as a default.
 * Otherwise don't use default value in the questions.
 *
 * @param {array} settings - array of values used as default if user is editing the .env file
 *
 * @returns array of questions passed to Inquirer
 *
 */
const mandatoryVariables = settings => {
  const clientIdDefaultMaybe =
    settings &&
    settings.REACT_APP_SHARETRIBE_SDK_CLIENT_ID !== '' &&
    settings.REACT_APP_SHARETRIBE_SDK_CLIENT_ID !== 'change-me'
      ? { default: settings.REACT_APP_SHARETRIBE_SDK_CLIENT_ID }
      : {};
  const clientSecretDefaultMaybe =
    settings && settings.SHARETRIBE_SDK_CLIENT_SECRET !== ''
      ? { default: settings.SHARETRIBE_SDK_CLIENT_SECRET }
      : {};
  const stripeDefaultMaybe =
    settings && settings.REACT_APP_STRIPE_PUBLISHABLE_KEY !== ''
      ? { default: settings.REACT_APP_STRIPE_PUBLISHABLE_KEY }
      : {};
  const mapBoxDefaultMaybe =
    settings && settings.REACT_APP_MAPBOX_ACCESS_TOKEN !== ''
      ? { default: settings.REACT_APP_MAPBOX_ACCESS_TOKEN }
      : {};
  const marketplaceNameDefaultMaybe =
    settings && settings.REACT_APP_MARKETPLACE_NAME !== ''
      ? { default: settings.REACT_APP_MARKETPLACE_NAME }
      : {};

  return [
    {
      type: 'input',
      name: 'REACT_APP_SHARETRIBE_SDK_CLIENT_ID',
      message: `What is your Sharetribe marketplace client ID?
${chalk.dim(
  'Client ID is needed for connecting with Sharetribe API. You can find your client ID from the Console.'
)}
`,
      validate: function(value) {
        if (value.match(/^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i)) {
          return true;
        }
        return 'Please enter valid Sharetribe Client ID. You can check it form Sharetribe Console!';
      },
      ...clientIdDefaultMaybe,
    },
    {
      type: 'input',
      name: 'SHARETRIBE_SDK_CLIENT_SECRET',
      message: `What is your Sharetribe marketplace client secret?
${chalk.dim(
  `Client Secret is needed for privileged transitions with Marketplace API.
Client secret is connected to client ID. You can find your client secret from Sharetribe Console.`
)}
`,
      ...clientSecretDefaultMaybe,
    },
    {
      type: 'input',
      name: 'REACT_APP_STRIPE_PUBLISHABLE_KEY',
      message: `What is your Stripe publishable key?
${chalk.dim(
  `Stripe publishable API key is for generating tokens with Stripe API. Use test key (prefix pk_test_) for development. Remember to also add the Stripe secret key to Console before testing the payments.
If you don't set the Stripe key, payments won't work in the application.`
)}
`,
      validate: function(value) {
        if (value.match(/^pk_/) || value === '') {
          return true;
        }
        return 'Please enter Stripe publishable key with prefix pk_!';
      },
      ...stripeDefaultMaybe,
    },
    {
      type: 'input',
      name: 'REACT_APP_MAPBOX_ACCESS_TOKEN',
      message: `What is your Mapbox access token?
${chalk.dim(
  `The Mapbox access token should be set via the Sharetribe Console. You can also configure it as an environment variable, which will be used as a fallback value.`
)}
`,
      ...mapBoxDefaultMaybe,
    },
    {
      type: 'input',
      name: 'REACT_APP_MARKETPLACE_NAME',
      message: `What is the name of your marketplace?
${chalk.dim(
  'The marketplace name is needed for the marketplace texts. If not set through environment variables, the name defaults to "Biketribe" (set in src/config/configDefault.js)'
)}
`,
      ...marketplaceNameDefaultMaybe,
    },
  ];
};

/**
 * Questions for advances variables. User can choose to edit these or not.
 * If some values already exist in the .env file use them as a default.
 * Otherwise don't use default value in the questions.
 *
 * @param {array} settings - array of values used as default if user is editing the .env file
 *
 * @returns array of questions passed to Inquirer
 *
 */

const advancedSettings = settings => {
  const rootUrlDefault = settings ? settings.REACT_APP_MARKETPLACE_ROOT_URL : null;
  const cspDefault = settings ? settings.REACT_APP_CSP : null;

  return [
    {
      type: 'confirm',
      name: 'showAdvancedSettings',
      message: 'Do you want to edit advanced settings?',
      default: false,
    },
    {
      type: 'input',
      name: 'REACT_APP_MARKETPLACE_ROOT_URL',
      message: `What is your canonical root URL?
${chalk.dim(
  'Canonical root URL of the marketplace is needed for social media sharing, SEO optimization, and social logins. When developing the template application locally URL is usually http://localhost:3000 (Note: you should omit any trailing slash)'
)}
`,
      default: function() {
        return rootUrlDefault ? rootUrlDefault : 'http://localhost:3000';
      },
      when: function(answers) {
        return answers.showAdvancedSettings;
      },
    },
    {
      type: 'input',
      name: 'REACT_APP_CSP',
      message: `Should Content Security Policy (CSP) be on block mode?
${chalk.dim(
  'Content Security Policy should be on "block" mode, when the app is live. However, for development purposes "report" mode might make sense. The default value for this settings is true.'
)}
`,
      default: function() {
        return cspDefault ? cspDefault : 'report';
      },
      when: function(answers) {
        return answers.showAdvancedSettings;
      },
    },
  ];
};

/**
 * First ask mandatory variables and then check if user also wants to edit the advanced settings.
 * Update the .env file with user input.
 *
 * @param {array} settings - array of values used as default if user is editing the .env file
 *
 */

const askQuestions = settings => {
  inquirer
    .prompt(mandatoryVariables(settings))
    .then(answers => {
      return readLines(answers);
    })
    .then(values => {
      const data = getData(values);
      updateEnvFile(data);

      console.log(chalk.yellow.bold(`Advanced settings:`));
      inquirer
        .prompt(advancedSettings(settings))
        .then(answers => {
          return readLines(answers);
        })
        .then(values => {
          const data = getData(values);
          updateEnvFile(data);
          showSuccessMessage();
        });
    })
    .catch(err => {
      console.log(chalk.red(`An error occurred due to: ${err.message}`));
    });
};

/**
 * Show succes message used after creating the .env file
 */
const showSuccessMessage = () => {
  console.log(`
${chalk.green.bold('.env file saved succesfully!')}

Start the Sharetribe Web Template application by running ${chalk.bold.cyan('yarn run dev')}

Note that the .env file is a hidden file so it might not be visible directly in directory listing. If you want to update the environment variables run ${chalk.cyan.bold(
    'yarn run config'
  )} again or edit the .env file directly. Remember to restart the application after editing the environment variables!
`);
};

/**
 * Create new .env file using .env-template
 */
const createEnvFile = () => {
  fs.copyFileSync('./.env-template', './.env', fs.constants.COPYFILE_EXCL);
};

/**
 * Get the saved values from .env file so they can be used as a default values
 *
 * @return array containing all keys and values saved to .env file
 */
const findSavedValues = () => {
  const savedEnvFile = fs.readFileSync('./.env').toString();

  const settings = savedEnvFile.split('\n').reduce((obj, line) => {
    const splits = line.split('=');
    const key = splits[0].trim();
    if (splits.length > 1) {
      obj[key] = splits
        .slice(1)
        .join('=')
        .trim();
    }
    return obj;
  }, {});

  return settings;
};

/**
 * Read all lines from existing .env file to array.
 * If line matches one of the keys in user's answers update add value to that line.
 * Otherwise keep the original line.
 *
 * @param {object} answers object containing all the inputs user has given to questions
 *
 * @return returns a Promise that resolves with values object containing user input and read lines
 */

const readLines = answers => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream('./.env'),
    });

    const lines = [];
    rl.on('line', function(line) {
      lines.push(line);
    });

    rl.on('close', () => {
      const values = { answers, lines };
      resolve(values);
    });
  });
};

/**
 *
 * Creates array of data that is saved to .env file
 *
 * @param {object} values contais lines read from .env file and answers from the user
 *
 * @returns array containing the data that needs to be saved to .env file
 */
const getData = values => {
  const { lines, answers } = values;

  const data = lines.map(line => {
    const key = getKeyFromAnswers(answers, line);
    if (key) {
      const value = `${answers[key]}`;
      return `${key}=${value.trim()}\n`;
    } else {
      return `${line}\n`;
    }
  });

  return data;
};

/**
 * Joins lines to create content that is written to .env file. This will overwrite the previous content.
 *
 * @param {array} data arry of lines to be written into .env file
 */
const updateEnvFile = data => {
  fs.writeFileSync('./.env', data.join(''));
};

/**
 * Check if line contains the key from the user answers.
 *
 * @param {object} answers array of answers user has given to questions
 * @param {string} line line from the existing .env file
 *
 * @returns key if the key matches to the one in the line
 */
const getKeyFromAnswers = (answers, line) => {
  let foundKey;
  if (answers) {
    foundKey = Object.keys(answers).find(function(key) {
      if (line.includes(key)) {
        return key;
      }
    });
  }
  return foundKey;
};

run();
