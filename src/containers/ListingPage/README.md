# ListingPage

Listing page is the place to see the full listing information and the page where the booking process
starts.

## Structure

There are 2 layout variants in use:

- ListingPageCarousel
- ListingPageConverPhoto

The rendered variant page consists of the generic Topbar and of different page sections.

- **SectionGaller**: contains the image carousel for ListingPageCarousel
- **SectionHero**: contains the listing image and the image carousel for ListingPageConverPhoto
- **SectionDetailsMaybe**: This shows all the listing fields with "enum" type search schema.
- **SectionMultiEnumMaybe**: contains a single listing field with "multi-enum" search schema.
- **SectionTextMaybe**: contains a single listing field with "text" search schema. It is also used
  for the _description_ attribute.
- **SectionMap**: shows map if the listing has geolocation set.
- **SectionReviews**: contains reviews related to this listing.
- **SectionAuthorMaybe**: shows info about the author of the listing.
- **SectionAvatar**: the listing author image.

In the main content, there are several sections that are likely to be customized, e.g. when adding
new extended data to the listing creation.

## Server rendering

Because the listing page is an important entry point to the marketplace when a user searches for
specific things of services outside the marketplace or comes through a link shared in social media,
it is important to ensure that server rendering works well to allow bots to index the page and its
metadata properly.

## SEO

As mentioned above, the listing page is important for search engines and other bots. Therefore it is
important to ensure that the schema metadata is up to date when making customizations to the page.
