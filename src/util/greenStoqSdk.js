class GreenStoqSdk {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async updateDocuments(listingId, documents) {
    const { documentsAdded, documentsRemoved } = documents;

    if (documentsRemoved.length > 0) {
      const urlDelete = `${this.baseUrl}/v1/listing/${listingId}/documents/delete`;
      await this.sendRequest(urlDelete, 'POST', { ids: documentsRemoved });
    }

    if (documentsAdded.length > 0) {
      const urlUpload = `${this.baseUrl}/v1/listing/${listingId}/documents`;
      await this.uploadFiles(urlUpload, 'POST', documentsAdded);
    }
  }

  async getDocuments(listingId) {
    const url = `${this.baseUrl}/v1/listing/${listingId}/documents`;
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
      const result = await response.json();
      console.log('Operation successful:', result);
      return result;
    } catch (error) {
      console.error('Operation error:', error);
      throw error;
    }
  }

  async uploadFiles(url, listingId, documents) {
    const formData = new FormData();
    for (let i = 0; i < documents.length; i++) {
      formData.append('files', documents[i]);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {}
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
      } else {
        console.error('Upload failed:', response);
      }
    } catch (error) {
      console.error('Error during file upload:', error);
    }
  }
}

export function createGreenStoqSdk(baseUrl) {
  return new GreenStoqSdk(baseUrl);
}

