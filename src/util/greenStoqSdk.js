class GreenStoqSdk {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async addDocument(listingId, document) {
    const url = `${this.baseUrl}/v1/listing/document/upload/${listingId}`;
    return await this.sendRequest(url, 'POST', document);
  }

  async updateDocument(listingId, document) {
    const url = `${this.baseUrl}/v1/listing/document/upload/${listingId}`;
    return await this.sendRequest(url, 'PUT', document);
  }

  async getDocument(listingId) {
    const url = `${this.baseUrl}/v1/listing/document/${listingId}`;
    return await this.sendRequest(url, 'GET');
  }

  async sendRequest(url, method, data) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}

export function createGreenStoqSdk(baseUrl) {
  return new GreenStoqSdk(baseUrl);
}

