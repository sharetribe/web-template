require('dotenv').config()
const fs = require('fs')
const { getISdk } = require('../server/api-util/sdk')
const sdk = getISdk()

inPersonHourlyToFixed()

// Update all hourly listings to fixed
function inPersonHourlyToFixed() {
  // TODO: Max 100; support pagination
  sdk.listings.query().then(res => {
    if (!res?.statusText === 'OK') throw new Error('Failed to get listings')
    const listings = res.data.data
    const inPerson = listings.filter(listing => listing.attributes.publicData.listingType === 'in-person')

    console.log(`Found ${inPerson.length} in-person listings`)

    const hourlyListings = inPerson.filter(listing => listing.attributes.publicData.unitType === 'hour')
    console.log(`Found ${hourlyListings.length} hourly listings`)

    for (const listing of hourlyListings) {
      console.log(`Updating listing ${listing.attributes.title} (${listing.id.uuid})`)
      sdk.listings.update({
        id: listing.id,
        publicData: {
          ...listing.attributes.publicData,
          unitType: 'fixed'
        }
      })
    }
  })
}
