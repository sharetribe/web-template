/* eslint-disable no-undef */
// TODO: Fix eslint to differentiate the server and client code

require('dotenv').config()
const fs = require('fs')
const { getISdk } = require('../server/api-util/sdk')
const sdk = getISdk()

// -----------------------------------------------------------------------------------

inPersonHourlyToFixed({ activate: false, dryRun: false, backup: false })
inPersonAndOnlineInstructorProfileFixedToHourly({ activate: true, dryRun: false, backup: false })

// -----------------------------------------------------------------------------------

// Update all in-person hourly listings to fixed
async function inPersonHourlyToFixed({ activate = false, dryRun = false, backup = false }) {
  if (!activate) return

  let allListings = []
  let currentPage = 1
  let totalPages = 1
  const perPage = 100 // Max allowed by the SDK

  console.log('Fetching listings...')

  do {
    try {
      const res = await sdk.listings.query({ page: currentPage, perPage })
      if (res?.statusText !== 'OK') throw new Error(`Failed to get listings on page ${currentPage}`)

      const listings = res.data.data
      const meta = res.data.meta
      allListings = allListings.concat(listings)
      totalPages = meta.totalPages

      console.log(`Fetched page ${currentPage}/${totalPages}, got ${listings.length} listings. Total fetched: ${allListings.length}`)

      currentPage++
    } catch (error) {
      console.error('Error fetching listings:', error)
      break
    }
  } while (currentPage <= totalPages)

  console.log(`Finished fetching. Total listings: ${allListings.length}`)

  if (backup) fs.writeFileSync('listings.backup.live.all.json', JSON.stringify(allListings, null, 2))

  const inPerson = allListings.filter(listing => listing.attributes.publicData.listingType === 'in-person')
  console.log(`Found ${inPerson.length} in-person listings out of ${allListings.length} total`)

  const hourlyListings = inPerson.filter(listing => listing.attributes.publicData.unitType === 'hour')
  console.log(`Found ${hourlyListings.length} hourly in-person listings`)

  for (const listing of hourlyListings) {
    console.log(`Processing listing ${listing.attributes.title} (${listing.id.uuid})`)
    if (dryRun) continue
    sdk.listings.update({
      id: listing.id,
      publicData: {
        ...listing.attributes.publicData,
        unitType: 'fixed'
      }
    })
  }

  console.log('Finished processing hourly listings.')
}

// Update all in-person and online instructor profile (calendar booking) listings to hourly
async function inPersonAndOnlineInstructorProfileFixedToHourly({ activate = false, dryRun = false, backup = false }) {
  if (!activate) return

  let allListings = []
  let currentPage = 1
  let totalPages = 1
  const perPage = 100 // Max allowed by the SDK

  console.log('Fetching listings...')

  do {
    try {
      const res = await sdk.listings.query({ page: currentPage, perPage })
      if (res?.statusText !== 'OK') throw new Error(`Failed to get listings on page ${currentPage}`)

      const listings = res.data.data
      const meta = res.data.meta
      allListings = allListings.concat(listings)
      totalPages = meta.totalPages

      console.log(`Fetched page ${currentPage}/${totalPages}, got ${listings.length} listings. Total fetched: ${allListings.length}`)

      currentPage++
    } catch (error) {
      console.error('Error fetching listings:', error)
      break
    }
  } while (currentPage <= totalPages)

  console.log(`Finished fetching. Total listings: ${allListings.length}`)

  if (backup) fs.writeFileSync('listings.backup.live.all.json', JSON.stringify(allListings, null, 2))

  const inPersonAndInstructorProfile = allListings.filter(listing => listing.attributes.publicData.listingType === 'in-person' || listing.attributes.publicData.listingType === 'instruction_and_consultation')
  console.log(`Found ${inPersonAndInstructorProfile.length} in-person and instructor profile listings out of ${allListings.length} total`)

  const fixedListings = inPersonAndInstructorProfile.filter(listing => listing.attributes.publicData.unitType === 'fixed')
  console.log(`Found ${fixedListings.length} fixed in-person and instructor profile listings`)

  for (const listing of fixedListings) {
    console.log(`Processing listing ${listing.attributes.title} (${listing.id.uuid})`)
    if (dryRun) continue
    sdk.listings.update({
      id: listing.id,
      publicData: {
        ...listing.attributes.publicData,
        unitType: 'hour'
      }
    })
  }
}
