const axios = require('axios');
const { trackManagementAPIEvent } = require('./analytics');

class ReferralAPIManagerClient {
  axiosClient = axios.create({
    baseURL: 'https://referral-factory.com/api/v2',
  });

  constructor() {
    this.axiosClient.interceptors.request.use(
      async config => {
        const apiToken = process.env.REFARRAL_API_TOKEN;
        config.headers.Authorization = `Bearer ${apiToken}`;
        return config;
      },
      error => Promise.reject(error)
    );

    this.axiosClient.interceptors.response.use(
      response => response,
      function(error) {
        console.error(`ReferralAPIManagerClient Error: ${error}`);
        return Promise.reject(error);
      }
    );
  }

  async getUser(email) {
    const { data } = await this.axiosClient.post(`/users/search`, {
      filters: {
        value: [
          {
            field: 'email',
            value: email,
            operator: '=',
          },
          {
            field: 'campaign_id',
            value: process.env.REFARRAL_CAMPAIGN_ID,
            operator: '=',
          },
        ],
        operator: 'AND',
      },
    });
    const result = data.data;
    const userFound = !!result.length;
    return {
      userFound,
      user: userFound ? result[0] : null,
    };
  }

  async addUser(email, firstName, lastName) {
    const { data } = await this.axiosClient.post(`/users`, {
      campaign_id: process.env.REFARRAL_CAMPAIGN_ID,
      first_name: firstName,
      email,
      meta: [
        {
          field: 'Last Name',
          value: lastName,
        },
      ],
    });
    return data.data;
  }

  async optIn(email, firstName, lastName) {
    const { userFound, user } = await this.getUser(email);
    if (userFound) {
      return user;
    }
    return await this.addUser(email, firstName, lastName);
  }

  async qualifyReferral(userId, email, firstName, lastName) {
    const { userFound, user } = await this.getUser(email);
    if (!userFound) {
      return await this.addUser(email, firstName, lastName);
    }
    const { code } = user || {};
    try {
      await this.axiosClient.put('/users/qualification', { qualified: true, code });
      const eventUser = { id: userId, email };
      trackManagementAPIEvent('REFERRAL_PROGRAM | Referral qualified', eventUser);
    } catch (e) {}
    return user;
  }
}

module.exports = {
  ReferralAPIManagerClient,
};
