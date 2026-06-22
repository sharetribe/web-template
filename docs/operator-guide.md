# Archivo Vintach — Operator Guide

This guide covers everything a marketplace operator needs to manage Archivo Vintach: configuring
content through the Sharetribe Console, setting up listing fields and categories, importing listings
in bulk, and understanding the application settings. No technical background is required.

---

## Table of Contents

1. [Sharetribe Console Overview](#1-sharetribe-console-overview)
2. [Listing Categories](#2-listing-categories)
3. [Listing Fields](#3-listing-fields)
   - [Color](#31-color-field)
   - [Género](#32-género-field)
   - [Estado (Condition)](#33-estado-condition-field)
   - [Estilo](#34-estilo-field)
   - [Tallas (Sizes)](#35-tallas-sizes-field)
   - [Marca (Brand)](#36-marca-brand-field)
4. [Landing Page Sections](#4-landing-page-sections)
   - [Hand-Picked Listing Carousel](#41-hand-picked-listing-carousel-avselections)
   - [Category Card Carousel](#42-category-card-carousel-avselectedcats)
   - [Tag or Category Filtered Carousel](#43-tag-or-category-filtered-carousel-avtaglistings)
   - [Recommended Listings Grid](#44-recommended-listings-grid-avrecommendeds)
   - [User Profile Carousel](#45-user-profile-carousel-avselectedusers)
   - [Instagram-Style Image Grid](#46-instagram-style-image-grid-avinstagrid)
   - [Hero Banner (Standard)](#47-hero-banner-standard-avhero)
   - [Hero Banner (Multi-Instance)](#48-hero-banner-multi-instance-avhero2)
   - [Block-Based Hero](#49-block-based-hero-avhero3)
   - [Video + Text Split](#410-video--text-split-avvideo)
   - [Pricing Plans](#411-pricing-plans-price-columns)
5. [Display Options](#5-display-options)
   - [Section Display Options](#51-section-display-options)
   - [Block Name Tokens](#52-block-name-tokens)
6. [Navigation Bar](#6-navigation-bar)
7. [The Hot List](#7-the-hot-list)
8. [Bulk Import Tool](#8-bulk-import-tool)
   - [Overview](#81-overview)
   - [How to Use It](#82-how-to-use-it)
   - [ZIP File Structure](#83-zip-file-structure)
   - [CSV Column Reference](#84-csv-column-reference)
   - [Field Values Quick Reference](#85-field-values-quick-reference)
   - [Troubleshooting](#86-troubleshooting)
9. [Application Settings](#9-application-settings)
10. [Custom Translation Strings](#10-custom-translation-strings)

---

## 1. Sharetribe Console Overview

All marketplace configuration is managed through the **Sharetribe Console** at
[flex-console.sharetribe.com](https://flex-console.sharetribe.com). The main areas you will use:

| Console Area                   | What you manage there                                  |
| ------------------------------ | ------------------------------------------------------ |
| **Content → Pages**            | Landing page sections, about page, and other CMS pages |
| **Content → Assets**           | Pricing plans JSON and other hosted data files         |
| **Content → Translations**     | Text strings used by custom sections                   |
| **Build → Listing fields**     | Custom product attributes (color, size, brand, etc.)   |
| **Build → Listing types**      | Which fields apply to which listing types              |
| **Build → Listing categories** | Category tree (Ropa, Bolsas, Zapatos, etc.)            |
| **Manage → Listings**          | View, edit, and moderate listings                      |
| **Manage → Users**             | View users and find their UUIDs                        |

---

## 2. Listing Categories

The marketplace uses a three-level category hierarchy. When creating or editing a listing, sellers
choose from these categories.

### Category Tree

| Level 1           | Level 2                     | Level 3                                                                                                                       |
| ----------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Ropa**          | Tops                        | Blusas, T-shirts, Crop-tops, Manga larga, Manga corta, Strapless, Bodys                                                       |
|                   | Camisetas                   | Manga corta, Manga larga, Sin mangas, Oversized, Gráficas / Estampadas, Básicas                                               |
|                   | Camisas                     | Manga corta, Manga larga, Vaqueras, Formales, Casuales, Seda                                                                  |
|                   | Pantalones                  | Formales, Casuales, Leggings, Sweatpants, Vintage, Cargo                                                                      |
|                   | Jeans                       | Mom fit, Boyfriend jeans, Baggy / Oversized, Rectos, Wide leg, Carpenter / Cargo, Acampanados / Flare, Slim fit, Skinny jeans |
|                   | Faldas                      | Larga, Midi, Mini, Denim, Seda                                                                                                |
|                   | Vestidos                    | Vestidos formales, Vestidos casuales, Largos, Midi, Mini, Manga larga, Manga corta, Sin manga, Novia / Bridal                 |
|                   | Chamarras / Abrigos / Sacos | —                                                                                                                             |
|                   | Sudaderas                   | —                                                                                                                             |
|                   | Shorts                      | —                                                                                                                             |
|                   | Ropa deportiva              | —                                                                                                                             |
|                   | Trajes / Sets               | —                                                                                                                             |
|                   | Jumpsuits                   | —                                                                                                                             |
|                   | Lencería / Pijama           | —                                                                                                                             |
|                   | De baño                     | —                                                                                                                             |
|                   | Maternidad                  | —                                                                                                                             |
| **Bolsas**        | De mano                     | —                                                                                                                             |
|                   | Cruzadas                    | —                                                                                                                             |
|                   | Clutch                      | —                                                                                                                             |
|                   | Formales                    | —                                                                                                                             |
|                   | Mochilas casuales           | —                                                                                                                             |
|                   | Mochilas de deporte         | —                                                                                                                             |
|                   | Totes                       | —                                                                                                                             |
|                   | Riñoneras                   | —                                                                                                                             |
|                   | Carteras                    | —                                                                                                                             |
|                   | Monederos                   | —                                                                                                                             |
| **Zapatos**       | Tacones                     | —                                                                                                                             |
|                   | Sandalias                   | —                                                                                                                             |
|                   | Sandalias con tacón         | —                                                                                                                             |
|                   | Zapatillas y Flats          | —                                                                                                                             |
|                   | Mocasines                   | —                                                                                                                             |
|                   | Plataformas                 | —                                                                                                                             |
|                   | Tenis casuales              | —                                                                                                                             |
|                   | Tenis deportivos            | —                                                                                                                             |
|                   | Botas                       | —                                                                                                                             |
|                   | Botas vaqueras              | —                                                                                                                             |
|                   | Botas con tacón             | —                                                                                                                             |
|                   | Botas de montaña            | —                                                                                                                             |
|                   | Botín                       | —                                                                                                                             |
|                   | Botín con tacón             | —                                                                                                                             |
| **Accesorios**    | Gorras / Gorros             | —                                                                                                                             |
|                   | Sombreros                   | —                                                                                                                             |
|                   | Lentes                      | —                                                                                                                             |
|                   | Cinturones                  | —                                                                                                                             |
|                   | Bufandas / Pañuelos         | —                                                                                                                             |
|                   | Joyerías                    | Collares, Aretes, Anillos, Pulseras, Relojes                                                                                  |
|                   | Guantes                     | —                                                                                                                             |
|                   | Otros                       | —                                                                                                                             |
| **Home Antiques** | Antigüedades                | —                                                                                                                             |

### Adding or Editing Categories

Go to **Console → Build → Listing categories**. You can add, rename, or reorder categories. Changes
take effect immediately for new listings. Existing listings already assigned to a category keep
their current assignment.

> **Important:** Category IDs (the short internal codes like `ropa-tops`, `zapatos-botas`) are set
> when a category is created and cannot be changed later. Choose IDs carefully. The display name can
> always be updated.

---

## 3. Listing Fields

Listing fields are the attributes sellers fill in when creating a listing (color, size, brand,
etc.).

> **Important — where each field lives:** Archivo Vintach uses **two sources** for listing fields.
> Most are managed in the Sharetribe Console, but three are defined in the application code and
> **cannot be edited in the Console**.
>
> | Field       | Where it lives                           | Who can edit          |
> | ----------- | ---------------------------------------- | --------------------- |
> | `color`     | App code (`src/config/configListing.js`) | Development team only |
> | `all_sizes` | App code (`src/config/configListing.js`) | Development team only |
> | `brand`     | App code (`src/config/configListing.js`) | Development team only |
> | `genero`    | Console → Build → Listing fields         | Operator              |
> | `estado`    | Console → Build → Listing fields         | Operator              |
> | `estilo`    | Console → Build → Listing fields         | Operator              |
>
> When a field with the same key exists in both Console and code, the **code definition wins**. So
> adding `color`, `all_sizes`, or `brand` in the Console has no effect — the app will ignore the
> Console version and use the code version. To add, rename, or remove options for these three
> fields, ask the development team to update `src/config/configListing.js`.
>
> The sections below describe the canonical setup. For the three code-only fields, the tables
> document what the app expects; you do **not** need to recreate them in the Console.

Fields managed in the Console (**Console → Build → Listing fields**) have:

- **Key** — the internal ID (never changes once created)
- **Schema type** — `enum` (pick one) or `multi_enum` (pick several)
- **Scope** — always `public` for searchable fields
- **Options** — the values sellers can choose from

After creating fields, go to **Console → Build → Listing types**, open your listing type, and add
the fields there so they appear in the listing form.

---

### 3.1 Color Field

> **Code-only field.** `color` is defined in `src/config/configListing.js`. Operators cannot edit it
> in the Console — changes require a development update.

| Property    | Value                                           |
| ----------- | ----------------------------------------------- |
| Key         | `color`                                         |
| Schema type | `multi_enum` (sellers can pick multiple colors) |
| Scope       | `public`                                        |

**Options to add:**

| Display Name | Option Key     |
| ------------ | -------------- |
| Rojo         | `rojo`         |
| Rosa         | `rosa`         |
| Amarillo     | `amarillo`     |
| Naranja      | `naranja`      |
| Dorado       | `dorado`       |
| Plateado     | `plateado`     |
| Verde        | `verde`        |
| Azul         | `azul`         |
| Morado       | `morado`       |
| Negro        | `negro`        |
| Gris         | `gris`         |
| Blanco       | `blanco`       |
| Crema        | `crema`        |
| Café         | `cafe`         |
| Animal Print | `animal-print` |
| Floral       | `floral-print` |
| Multicolor   | `multicolor`   |

> **Important:** The option keys must match exactly as shown above (lowercase, hyphens not spaces).
> If you add a new color, the development team must also add its swatch image to the app.

---

### 3.2 Género Field

| Property    | Value             |
| ----------- | ----------------- |
| Key         | `genero`          |
| Schema type | `enum` (pick one) |
| Scope       | `public`          |

**Options:**

| Display Name | Option Key |
| ------------ | ---------- |
| Mujer        | `mujer`    |
| Hombre       | `hombre`   |
| Unisex       | `unisex`   |

---

### 3.3 Estado (Condition) Field

| Property    | Value             |
| ----------- | ----------------- |
| Key         | `estado`          |
| Schema type | `enum` (pick one) |
| Scope       | `public`          |

**Options (add in this order — best to most worn):**

| Display Name       | Option Key           |
| ------------------ | -------------------- |
| Nuevo con etiqueta | `nuevo-con-etiqueta` |
| Nuevo sin etiqueta | `nuevo-sin-etiqueta` |
| Como nuevo         | `como-nuevo`         |
| Buen estado        | `buen-estado`        |
| Usado              | `usado`              |

---

### 3.4 Estilo Field

| Property    | Value                                           |
| ----------- | ----------------------------------------------- |
| Key         | `estilo`                                        |
| Schema type | `multi_enum` (sellers can pick multiple styles) |
| Scope       | `public`                                        |

**Options:**

| Display Name        | Option Key          |
| ------------------- | ------------------- |
| Vintage             | `vintage`           |
| Urbano / Streetwear | `urbano_streetwear` |
| Fiesta / Noche      | `fiesta_noche`      |
| Formal              | `formal`            |
| Casual              | `casual`            |
| Boho                | `boho`              |
| Retro               | `retro`             |
| Oficina             | `oficina`           |
| Vacaciones          | `vacaciones`        |
| Seda                | `seda`              |

---

### 3.5 Tallas (Sizes) Field

> **Code-only field.** `all_sizes` is defined in `src/config/configListing.js`. Operators cannot
> edit it in the Console — changes require a development update.

| Property    | Value                                          |
| ----------- | ---------------------------------------------- |
| Key         | `all_sizes`                                    |
| Schema type | `multi_enum` (sellers can pick multiple sizes) |
| Scope       | `public`                                       |

The grouping (Estándar, MX, US, Curvy) is handled by the app automatically. The list below documents
the canonical options defined in code.

**Options to add:**

**Estándar group**

| Display Name | Option Key |
| ------------ | ---------- |
| Unitalla     | `unitalla` |
| XXS          | `xxs`      |
| XS           | `xs`       |
| S            | `s`        |
| M            | `m`        |
| L            | `l`        |
| XL           | `xl`       |
| XXL          | `xxl`      |
| XXXL         | `xxxl`     |

**MX group**

| Display Name | Option Key |
| ------------ | ---------- |
| MX 22        | `mx_22`    |
| MX 24        | `mx_24`    |
| MX 26        | `mx_26`    |
| MX 28        | `mx_28`    |
| MX 30        | `mx_30`    |
| MX 32        | `mx_32`    |
| MX 34        | `mx_34`    |
| MX 36        | `mx_36`    |
| MX 38        | `mx_38`    |
| MX 40        | `mx_40`    |
| MX 42        | `mx_42`    |
| MX 44        | `mx_44`    |

**US group**

| Display Name | Option Key |
| ------------ | ---------- |
| US 00        | `us_00`    |
| US 0         | `us_0`     |
| US 2         | `us_2`     |
| US 4         | `us_4`     |
| US 6         | `us_6`     |
| US 8         | `us_8`     |
| US 10        | `us_10`    |
| US 12        | `us_12`    |
| US 14        | `us_14`    |
| US 16        | `us_16`    |

**Curvy group**

| Display Name | Option Key |
| ------------ | ---------- |
| 1X           | `curvy_1x` |
| 2X           | `curvy_2x` |
| 3X           | `curvy_3x` |
| 4X           | `curvy_4x` |
| 5X           | `curvy_5x` |
| 6X           | `curvy_6x` |

---

### 3.6 Marca (Brand) Field

> **Code-only field.** `brand` is defined in `src/config/configListing.js`. Operators cannot edit it
> in the Console — changes require a development update.

| Property    | Value                               |
| ----------- | ----------------------------------- |
| Key         | `brand`                             |
| Schema type | `enum` (pick one brand per listing) |
| Scope       | `public`                            |

The brand list has 623 options and is managed entirely in `src/config/configListing.js`. You can see
the full list in `docs/data/brand.csv`. To add or remove brands, ask the development team. Any
`brand` field configured in the Console is ignored by the app.

---

## 4. Landing Page Sections

The landing page is built in **Console → Content → Pages → Landing Page**. Each section you add
creates one visual block on the page.

### How sections work

Every section has:

- **Section Type** — determines what the section does (the "template")
- **Section ID** — a unique name for this specific section
- **Section Name** — optional display name; also used to apply visual style tokens (see
  [Section 5 — Display Options](#5-display-options))
- **Blocks** — individual items inside the section (listings, categories, images, etc.)
- **Block Name** — used by custom sections to pass data; also carries display tokens for
  block-level styling (see [Block Name Tokens](#52-block-name-tokens))

---

### 4.1 Hand-Picked Listing Carousel (`avSelections`)

Displays a horizontal scrollable carousel of specific listings you choose manually.

**Setup:**

1. Add a section. Set **Section Type** to `avSelections`.
2. Set **Section ID** to `av-selections` or `av-selections-[any-name]` (e.g.
   `av-selections-verano`). Each unique ID is a separate independent carousel.
3. Add one block per listing. In each block, set **Block Name** to the listing's UUID.
   - Find a listing's UUID in Console → Manage → Listings → open the listing → copy the ID from the
     URL.
4. Optionally add a Title, Description, and Call to Action to the section header.

**Notes:**

- Only published listings appear. Drafts and closed listings are silently skipped.
- The order of blocks controls the order of listings in the carousel.
- You can have multiple `av-selections-*` sections on the same page.

---

### 4.2 Category Card Carousel (`avSelectedCats`)

Displays a horizontal carousel of category cards. Each card shows a photo and category name, and
clicking it opens the search page filtered to that category. No automatic data loading — all content
comes from what you enter in the Console.

**Setup:**

1. Set **Section Type** to `avSelectedCats`.
2. Set **Section ID** to `av-selected-cats` or `av-selected-cats-[name]`.
3. Add one block per category:
   - **Block Name** — the category ID (e.g. `ropa`, `ropa-vestidos`, `bolsas`, `zapatos`)
   - **Title** — optional display name. If omitted, the app uses the category's name from your
     category configuration.
   - **Media** — upload the photo shown on the card.

**Notes:**

- The category ID in Block Name must exactly match the ID in your category configuration.
- Cards link to the search page filtered by that category.

---

### 4.3 Tag or Category Filtered Carousel (`avTagListings`)

Displays a carousel of listings automatically fetched by a filter. The filter is defined in the
first block's Block Name.

**Setup:**

1. Set **Section Type** to `avTagListings`.
2. Set **Section ID** to `av-tag-listings-[name]` (e.g. `av-tag-listings-hot`).
3. Add **one block**. Set its **Block Name** using one of these formats:

| Block Name format   | What it fetches                             |
| ------------------- | ------------------------------------------- |
| `tag:hot-list`      | Listings tagged `hot-list`                  |
| `cat:ropa-vestidos` | Listings in the `ropa-vestidos` category    |
| `hot-list`          | Same as `tag:hot-list` (tag is the default) |

**Notes:**

- Shows up to 24 published listings.
- Only the first block's Block Name is used as the filter. Additional blocks are ignored.
- You can have multiple `av-tag-listings-*` sections, each with its own filter.

---

### 4.4 Recommended Listings Grid (`avRecommendeds`)

Displays a multi-column grid of hand-picked listings. Works the same as the carousel but renders as
a grid.

**Setup:**

1. Set **Section ID** to exactly `av-recommendeds` (this is fixed — only one per page).
2. Set **Section Type** to `avRecommendeds`.
3. Add one block per listing, setting **Block Name** to the listing's UUID.

---

### 4.5 User Profile Carousel (`avSelectedUsers`)

Displays a horizontal carousel of user profile cards. Useful for featuring sellers or brand
partners.

**Setup:**

1. Set **Section Type** to `avSelectedUsers`.
2. Set **Section ID** to `av-selected-users` or `av-selected-users-[name]`.
3. Add one block per user. Set **Block Name** to the user's UUID.
   - Find a user's UUID in Console → Manage → Users → open the user → copy the ID from the URL.

---

### 4.6 Instagram-Style Image Grid (`avInstaGrid`)

Displays a responsive photo grid from images you upload directly in the Console. Best for lookbook
galleries or mood boards. No listing data is loaded.

**Setup:**

1. Set **Section Type** to `avInstaGrid`.
2. Set **Section ID** to `av-insta-grid` or `av-insta-grid-[name]`.
3. Add one block per image. Upload the image in the block's **Media** field. Block title and
   description are optional overlays.

**Column behavior by screen size:**

| Screen width              | Number of columns |
| ------------------------- | ----------------- |
| Very small (under 550 px) | 2                 |
| Small (550–767 px)        | 3                 |
| Medium (768–1023 px)      | 4                 |
| Large (1024 px and up)    | 6                 |

---

### 4.7 Hero Banner (Multi-Instance) (`avHero2`)

A flexible hero banner: a background image with a title, description, and up to two CTA buttons. It
supports an optional mobile-only background, an optional whole-section link, and per-instance button
styling. You can place several independent `avHero2` instances on the same page — each is keyed by its Section ID.

**How it renders:**

- One hero panel: background image (full-bleed) with the title, description, and buttons overlaid.
- The **instance name** is the part of the Section ID after `av-hero2-` (e.g. `av-hero2-summer` →
  `summer`). All translation keys below use that name: `AVHero2.summer.cta1Text`, etc.

**Setup (Console → Content → Pages → [page] → Add section):**

1. Set **Section Type** to `avHero2`.
2. Set **Section ID** to `av-hero2-[unique-name]` (e.g. `av-hero2-summer`).
3. Set the **desktop background image** in the section's **appearance** settings.
4. Fill in the **Title** and **Description** in the section fields.
5. Add the buttons and any options via the translation keys in the table below (Console → Content →
   Translations).

**Buttons (CTAs):** Each button appears only when its **text** key is set.

- A button uses `AVHero2.<name>.cta1Text` / `cta2Text` for its label and
  `AVHero2.<name>.cta1Link` / `cta2Link` for its destination (default `/s`).
- On **CMS pages** (`/p/...`) you may instead fill the section's built-in **Call to Action** fields;
  the translation keys, when set, take precedence. On the **Landing page**, buttons come **only** from
  the translation keys.

**Translation strings** (Console → Content → Translations; replace `<name>` with the Section ID
suffix):

| Key                                     | Default | Effect                                                                                  |
| --------------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| `AVHero2.<name>.cta1Text`               | empty   | First button label. The button only shows when this is set.                             |
| `AVHero2.<name>.cta1Link`               | `/s`    | First button destination (used when `cta1Text` is set).                                 |
| `AVHero2.<name>.cta1Style`              | empty   | First button style tokens (see below). Empty → Section Name CTA tokens, then `primary`.  |
| `AVHero2.<name>.cta2Text`               | empty   | Second button label. The button only shows when this is set.                            |
| `AVHero2.<name>.cta2Link`               | `/s`    | Second button destination.                                                              |
| `AVHero2.<name>.cta2Style`              | empty   | Second button style tokens. Empty → Section Name CTA tokens, then `secondary`.           |
| `AVHero2.<name>.mobileBackgroundUrl`    | empty   | Background image shown only on mobile (≤767 px), layered above the desktop background.   |
| `AVHero2.<name>.bgLink`                 | empty   | Makes the whole section a link to this URL. Leave unset or set to `#` for no link.       |

**Button styling — two ways:**

1. **Per button (translation):** `cta1Style` / `cta2Style` take space-separated **short** tokens.
   Combine a colour with shape/font tokens, e.g. `blue rounded` or `purple solid`.
   - Colour: `primary`, `secondary`, `blue`, `lightBlue`, `purple`, `pink`, `yellow`
   - Shape / border: `roundedFull`, `rounded`, `square`, `dashed`, `solid`, `noOutline`
   - Font: `headingFont`, `bodyFont`, `accentFont`
2. **Both buttons (Section Name):** If you leave `cta1Style` / `cta2Style` empty, any CTA tokens on the
   **Section Name** style **both** buttons — e.g. Section Name `Summer Hero - SectionCtaBtnBlue -
   Rounded`. See [Section display options](#51-section-display-options) for the full token list.
   When neither is set, buttons fall back to the default `primary` / `secondary` styles.

**Section Name display tokens:** Beyond the CTA tokens above, this section honours the standard
Section Name tokens (title colour/alignment, paddings, etc. — see
[Section display options](#51-section-display-options)). The hero-specific one is **`- ShortHero`**,
which reduces the hero's height.

---

### 4.9 Block-Based Hero (`avHero3`)

A two-panel hero. Each panel is a full-bleed background image with a text overlay and an optional
button. Best for split layouts such as "Women / Men" or "New In / Sale".

**How it renders:**

- The section uses its **first two blocks** as the two panels. A single block renders one full-width
  panel; any blocks beyond the first two are ignored.
- Panels sit **side by side on desktop** (≥768 px) and **stack vertically on mobile** (<768 px).
- Each panel's title and description are overlaid in white at the **bottom-left** of the image.
  (Per-block text alignment is not operator-configurable.)

**Setup (Console → Content → Pages → [page] → Add section):**

1. Set **Section Type** to `avHero3`.
2. Set **Section ID** to `av-hero3-[name]` (e.g. `av-hero3-shop`). The part after `av-hero3-` (here,
   `shop`) is the instance name used by the optional style keys below.
3. Add up to two blocks. For each block:
   - **Block image (Media):** upload the panel's background image. Required for the panel to show an
     image.
   - **Block title / Block text:** optional overlay text.
   - **Block image link** (optional): set the block image's **Link** to make the **whole panel**
     clickable — an internal path (e.g. `/s?pub_categoryLevel1=ropa`) or an external URL.
   - **Call to action** (optional): add a **button** with its own text and Internal/External link
     address. This link is **independent** of the Block image link.

**Two clickable areas, two destinations:** The Block image link makes the entire panel a link; the
Call to action button has its own separate link. They may point to different places. The button is
layered above the panel link, so both work and there are no invalid nested links.

**Behavior matrix (per panel):**

| Block image link | Call to action | Result                                                                          |
| ---------------- | -------------- | ------------------------------------------------------------------------------- |
| set              | set            | Whole panel links to the image-link address; the button shows with its own link |
| set              | empty          | Whole panel links to the image-link address; no button                          |
| empty            | set            | Panel is not clickable; only the button (with its own link) shows               |
| empty            | empty          | Static panel — image + text, nothing clickable                                  |

**Optional — button styling:** Button appearance is controlled by **name tokens**, not translation
strings. If you set none, buttons use the default `primary` style.

- **Both panels at once** — add CTA tokens to the section's **Section Name** (e.g.
  `- SectionCtaBtnBlue - Rounded`). See [Section display options](#51-section-display-options) for
  the full token list.
- **A single panel** — add tokens to that block's **Block Name** using the `token ::` syntax (each
  token ends with a space + `::`). This overrides the section-level style for just that panel.
  See [Block Name Tokens](#52-block-name-tokens) for the full list.
  - Colour (pick one): `blockCtaBtnBlue`, `blockCtaBtnLightBlue`, `blockCtaBtnPurple`,
    `blockCtaBtnPink`, `blockCtaBtnYellow`
  - Shape / style: `roundedFull`, `rounded`, `square`, `dashed`, `solid`, `noOutline`, `ctaBtnCenter`
  - Example Block Name: `blockCtaBtnBlue :: rounded ::`

**Translation strings:** None are used by this section. The background image, the panel link, the
button text and link, and the button styling all come from the block (and Section/Block Name tokens).

---

### 4.10 Video + Text Split (`avVideo`)

A full-width section split in two halves: an autoplay video on the left, and title, description, and
CTA on the right. On mobile the halves stack vertically.

**Setup:**

1. Set **Section Type** to `avVideo`.
2. Set **Section ID** to `av-video-[name]`.
3. Fill in Title, Description, and Call to Action for the right side.
4. To set the video URL, go to Console → Content → Translations and add:

> `AVVideo.[your-section-id].videoUrl` = (direct video file URL, e.g. an MP4 link)

**Notes:**

- The video autoplays muted and loops.
- Browser autoplay policies may prevent autoplay on some devices unless the video is muted.

---

### 4.11 Pricing Plans (`price-columns`)

Displays the interactive pricing plan selector with monthly/annual toggle.

**Setup:**

1. Set **Section Type** to `price-columns`.
2. The content (plan names, prices, features, CTAs) is loaded from a hosted data file. Go to
   **Console → Content → Assets** and create a file at path `content/pricing-plans.json` with your
   plan data. Ask the development team for the exact format.

---

## 5. Display Options

Both sections and individual blocks accept name-based style tokens that change their visual
appearance without any code changes. These tokens are set directly in the **Section Name** or
**Block Name** fields in the Sharetribe Console — no developer involvement needed.

- **Section Name tokens** (prefix `- Token`) — apply to the whole section: layout width, title
  colour, padding, button colour, and more. See [Section Display Options](#51-section-display-options).
- **Block Name tokens** (suffix `token ::`) — apply to a single block: title style, button colour,
  embedded components, and more. See [Block Name Tokens](#52-block-name-tokens).

Multiple tokens of either kind can be combined freely.

---

### 5.1 Section Display Options

Any section's **Section Name** field can carry extra style tokens that change how that section
looks, with no code changes. Write each token **after** the section's normal name as a space, a
dash, a space, then the token (`- Token`). Combine as many as you like.

**Example:** `My Hero Section - Large - CenterTitleText - NoPaddings`

> Tokens are matched as whole words, so similar tokens never collide — `- Large` does not trigger
> `- LargeDesc`, and `- NoPaddings` is not triggered by any longer token.

#### Layout and width

| Token              | Effect                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `- Large`          | Widens the content area (up to 1370 px) so the section spans most of the page instead of the default reading width.                                          |
| `- FullW`          | Full browser width, edge to edge — removes horizontal padding and the rounded corners on images. Best for full-bleed banners and image strips.               |
| `- FullWHeader`    | Lets the header (title + description) stretch the full content width instead of being capped at the default reading width. Pairs well with centered text.     |
| `- ShortHero`      | **Hero banners only** (`avHero2`): cuts the hero height to roughly half the screen.                                                                           |
| `- 2/3 cols`       | **Two-column sections only**: splits the two columns into a one-third / two-thirds ratio instead of an even 50 / 50 split.                                    |
| `- AvFeature`      | Feature layout — image and text sit side by side, full-bleed with no padding. This already includes full-width behaviour, so you do **not** add `- FullW`.    |
| `- ReverseFeature` | The same feature layout as `- AvFeature`, but with the image on the opposite side.                                                                            |

#### Title and text

| Token               | Effect                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `- BlueTitle`       | Colours the section title (heading levels 1–3) in AV brand blue and adds a little space below the header.                                                    |
| `- WhiteTitle`      | Colours the section title (heading levels 1–3) white — use on dark backgrounds.                                                                              |
| `- CenterTitleText` | Centres the section title horizontally.                                                                                                                      |
| `- CenterDescText`  | Centres the section's description paragraph.                                                                                                                  |
| `- LargeDesc`       | Widens the description (up to 968 px on larger screens) so a long intro wraps onto fewer lines.                                                               |
| `- SmallerTitles`   | Shifts every heading down one size level: H1 → 30 px, H2 → 20 px, H3 → 18 px, H4 → 16 px, H5 → 14 px. Use when a section's default headings feel too large.   |

#### Spacing

| Token             | Effect                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `- NoPaddings`    | Removes all padding (top, bottom, left and right) around the content.                                                                     |
| `- SmallGapCols`  | **Column / grid sections only**: tightens the horizontal gap between columns to 8 px (default 32 px).                                     |
| `- SmallGapRows`  | **Column / grid sections only**: tightens the vertical gap between rows to 8 px (default 32 px). Combine with `- SmallGapCols` for both.  |
| `- NoGapCols`     | **Column / grid sections only**: removes the horizontal gap between columns entirely (0 px).                                              |
| `- NoGapRows`     | **Column / grid sections only**: removes the vertical gap between rows entirely (0 px). Combine with `- NoGapCols` for a flush grid.      |

#### Call-to-action button colour

Restyles the CTA buttons inside the section (hero buttons, feature buttons, etc.). Pick **one** colour.

| Token                      | Effect            |
| -------------------------- | ----------------- |
| `- SectionCtaBtnBlue`      | Blue button       |
| `- SectionCtaBtnLightBlue` | Light-blue button |
| `- SectionCtaBtnPurple`    | Purple button     |
| `- SectionCtaBtnPink`      | Pink button       |
| `- SectionCtaBtnYellow`    | Yellow button     |

#### Call-to-action button shape and font

Combine these freely with one colour token above (e.g.
`- SectionCtaBtnBlue - RoundedFull - HeadingFont`). Used on their own — with no colour token — they
restyle the section's default button.

| Token            | Effect                                        |
| ---------------- | --------------------------------------------- |
| `- RoundedFull`  | Fully rounded (pill) corners.                 |
| `- Rounded`      | Slightly rounded corners (10 px).             |
| `- Square`       | Nearly straight corners (4 px).               |
| `- Dashed`       | Dashed outline.                               |
| `- Solid`        | Solid outline.                                |
| `- NoOutline`    | Removes the button's outline.                 |
| `- HeadingFont`  | Heading font on the button label.             |
| `- BodyFont`     | Body font on the button label.                |
| `- AccentFont`   | Accent (decorative) font on the button label. |
| `- CtaBtnCenter` | Centres a single button horizontally.         |

---

### 5.2 Block Name Tokens

Block-level styling is controlled by tokens placed inside a block's **Block Name** field in
Console. Each token ends with ` ::` (a space, then a double colon). Combine as many as you like, in
any order.

**Example:** `2Buttons :: smallerTitles ::`

#### Layout and structure

| Token                | Effect                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `2Buttons ::`        | Adds a row of two buttons below the block content. Button text, links and styles come from the intl keys `TwoButtons.<blockId>.*` (see §10).  |
| `photoSlider ::`     | Adds a 4-image photo carousel that auto-advances. Image URLs come from `PhotoSlider.<blockId>.image_1` … `.image_4` (see §10).                |
| `mediaTitle ::`      | Moves the block's image to sit **between** the title and the rest of the content (title → image → text/button) instead of above the title.    |
| `icon img ::`        | Renders the block's image as a small centred icon (48 px) and tightens the surrounding text — for icon-and-label feature blocks.              |
| `social links ::`    | Shows social-media icon links (rendered by the footer block).                                                                                |
| `newsletter form ::` | Embeds the Brevo email signup form. Disclaimer / success / error text come from the `NewsletterForm.*` keys (see §10).                        |

#### Title style

| Token              | Effect                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smallerTitles ::` | Shifts every heading in the block down one size level (H1 → 30 px, H2 → 20 px, H3 → 18 px, H4 → 16 px, H5 → 14 px). Block-level mirror of section `- SmallerTitles`. |
| `blueTitle ::`     | Colours only the block's own title in AV brand blue. Does **not** affect headings inside the body text. Block-level mirror of section `- BlueTitle`.            |
| `fullLinks ::`     | Keeps links inside the block's body paragraphs whole — a word or URL is never broken mid-character (`word-break: keep-all`); a too-long link overflows at full size instead of being split. |

#### Block CTA button colour

These set the colour of a single block's call-to-action button. They are mainly used to override
the section-level button colour on one `avHero3` panel (see §4.9). Pick **one** colour.

| Token                     | Effect            |
| ------------------------- | ----------------- |
| `blockCtaBtnBlue ::`      | Blue button       |
| `blockCtaBtnLightBlue ::` | Light-blue button |
| `blockCtaBtnPurple ::`    | Purple button     |
| `blockCtaBtnPink ::`      | Pink button       |
| `blockCtaBtnYellow ::`    | Yellow button     |

The same shape and font modifiers available for section buttons also work here with the `::`
syntax, layered on top of the colour: `roundedFull ::`, `rounded ::`, `square ::`, `dashed ::`,
`solid ::`, `noOutline ::`, `headingFont ::`, `bodyFont ::`, `accentFont ::`, `ctaBtnCenter ::`. A
modifier on its own (e.g. `ctaBtnCenter ::`) keeps whatever colour the section already set.

**Example Block Name:** `blockCtaBtnBlue :: rounded ::`

#### Block ID shorthands

These special **Block ID** values activate a specific block component automatically — you do not
need to set the Block Type field.

| Block ID          | Block component rendered                                       |
| ----------------- | -------------------------------------------------------------- |
| `av-insta-feed`   | Instagram feed widget                                          |
| `av-table-*`      | Markdown table (e.g. `av-table-fees`); content from block text |
| `av-contact-form` | Brevo contact form                                             |

---

## 6. Navigation Bar

The top navigation bar has three dropdown menus on desktop:

- **Ropa** — clothing subcategories
- **Accesorios** — accessories, bags, shoes
- **Marcas** — automatically built from the brand field options

### Editing Dropdowns 1 and 2 (Ropa and Accesorios)

These dropdowns are managed in a file called `top-bar.json` in the app. To change the categories
shown, ask the development team to update this file. The current configuration shows:

**Ropa dropdown:** Ver Todo, Tops, Camisetas, Camisas, Chamarras/Sacos, Pantalones, Jeans, Faldas,
Vestidos, Ropa Deportiva, Jumpsuits, Sets

**Accesorios dropdown:** Ver Todo, Bolsas, Zapatos, Cinturones, Gorras/Gorros, Joyería

### Dropdown 3 — Marcas (Automatic)

This dropdown builds itself automatically from the brand field options in the app configuration. You
do not need to configure it — it always reflects the current brand list.

---

## 7. The Hot List

The Hot List is a curated carousel of featured listings. Any published listing tagged with
`hot-list` automatically appears in it.

### Adding a listing to the Hot List

**Via Sharetribe Console:**

1. Go to Console → Manage → Listings.
2. Open the listing.
3. In the Extended Data / Public Data section, find the `tags` field and add `hot-list`.
4. Save.

**Via the bulk import tool:** Add `hot-list` to the `pd_tags` column for any listing row in your
CSV.

### Removing a listing from the Hot List

Remove `hot-list` from the listing's `tags` field. The listing will no longer appear in the Hot List
on the next page load.

### Creating additional curated carousels

You can create as many tag-based carousels as you want. For example, to create a "New Arrivals"
carousel:

1. Tag the relevant listings with `nueva-llegada` in their public data.
2. Add a `avTagListings` section to the landing page with Section ID `av-tag-listings-nuevas`.
3. Add one block with Block Name `nueva-llegada`.

---

## 8. Bulk Import Tool

### 8.1 Overview

The bulk import tool lets you create many listings at once by uploading a single ZIP file that
contains a CSV spreadsheet and all the listing images. It is available at `/admin/bulk-import` on
the marketplace.

**Key facts:**

- Up to 100 listings per import
- Up to 400 images per ZIP file
- Maximum ZIP file size: 50 MB
- Each row in the CSV creates one listing
- Rows are processed one by one — if one row fails, the others continue
- You must be signed in with an operator account allowlisted by the development team

---

### 8.2 How to Use It

1. **Open the tool** — go to `[your marketplace URL]/admin/bulk-import`.
2. **Confirm you are signed in as an allowlisted operator** — there is no import key to enter or
   store in the browser.
3. **Download the CSV template** — click "Download CSV Template" to get a blank spreadsheet with all
   the correct column headers.
4. **Fill in the CSV** — one row per listing. See the
   [CSV Column Reference](#84-csv-column-reference) below.
5. **Prepare your images** — name each image file clearly. Image filenames in the CSV must exactly
   match the filename (including extension) of the image files in your ZIP.
6. **Create the ZIP** — pack your completed CSV and all image files into a single `.zip` archive.
   Images can be in subfolders.
7. **Upload and start** — click "Select ZIP file", choose your archive, then click "Start Import".
8. **Monitor progress** — the page shows a live progress bar and reports which listings were created
   successfully and which rows had errors.

---

### 8.3 ZIP File Structure

Your ZIP must contain exactly one CSV file (at any level inside the archive) and all the images
referenced by that CSV.

**Example:**

```
my-listings.zip
├── listings.csv
├── vestido-frente.jpg
├── vestido-trasera.jpg
└── photos/
    ├── jeans-frente.jpg
    └── jeans-detalle.jpg
```

**ZIP rules:**

- Exactly one CSV file (any filename, any folder level)
- All images referenced in the CSV must be present
- Two images cannot share the same filename, even in different folders
- Maximum 401 entries (1 CSV + up to 400 images)
- Maximum 50 MB compressed upload size

---

### 8.4 CSV Column Reference

#### Required columns

| Column        | What to enter                                              |
| ------------- | ---------------------------------------------------------- |
| `title`       | Listing title. Cannot be empty.                            |
| `description` | Listing description. Cannot be empty.                      |
| `price`       | Price in pesos (e.g. `450.00`). Must be a positive number. |

#### Optional core columns

| Column             | Default         | What to enter                                                                                   |
| ------------------ | --------------- | ----------------------------------------------------------------------------------------------- |
| `author_id`        | Set by operator | The Sharetribe UUID of the seller this listing belongs to. Find it in Console → Manage → Users. |
| `currency`         | `MXN`           | Currency code. Leave blank for MXN.                                                             |
| `publish`          | `yes`           | `yes` to publish immediately, `no` to save as draft.                                            |
| `shipping_enabled` | `true`          | `true` or `false`                                                                               |
| `pickup_enabled`   | `false`         | `true` or `false`                                                                               |
| `location_address` | _(empty)_       | Human-readable address (optional).                                                              |
| `location_lat`     | _(empty)_       | Latitude number (optional, used for location search).                                           |
| `location_lng`     | _(empty)_       | Longitude number (optional).                                                                    |

#### Image columns

Each listing has four labeled image slots. Front, back, and horizontal are required. Details is
optional.

| Column             | Required | Description                                                    |
| ------------------ | -------- | -------------------------------------------------------------- |
| `image_front`      | Yes      | Filename of the front-facing image (e.g. `vestido-frente.jpg`) |
| `image_back`       | Yes      | Filename of the back-facing image                              |
| `image_horizontal` | Yes      | Filename of the horizontal / wide-angle image                  |
| `image_details`    | No       | Filename of the close-up details image                         |

Filenames are **case-sensitive** and must match exactly the filename inside the ZIP (the folder path
is ignored — only the filename matters).

#### Extended data columns (`pd_*` prefix)

These columns set the listing's searchable attributes. All column names start with `pd_`. The prefix
is stripped when saving — so `pd_brand` becomes the `brand` attribute on the listing.

| CSV Column          | Required | Valid values                                                                                                 |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `pd_categoryLevel1` | Yes      | See [Category IDs](#category-ids) below                                                                      |
| `pd_categoryLevel2` | Yes      | See [Category IDs](#category-ids) below                                                                      |
| `pd_categoryLevel3` | No       | See [Category IDs](#category-ids) below                                                                      |
| `pd_color`          | Yes      | One or more color option keys, pipe-separated (e.g. `azul` or `azul\|negro`)                                 |
| `pd_all_sizes`      | Yes      | One or more size option keys, pipe-separated (e.g. `s\|m\|l`)                                                |
| `pd_brand`          | Yes      | One brand option key (e.g. `zara`, `gucci`)                                                                  |
| `pd_genero`         | Yes      | One gender option key                                                                                        |
| `pd_estado`         | Yes      | One condition option key                                                                                     |
| `pd_estilo`         | Yes      | One or more style option keys, pipe-separated                                                                |
| `pd_originalPrice`  | Yes      | The original retail price in pesos (e.g. `650.00`). Must be higher than `price` to show as a strike-through. |
| `pd_tags`           | No       | Pipe-separated tags (e.g. `hot-list` or `hot-list\|nueva-llegada`)                                           |

> **Multi-value fields** (`pd_color`, `pd_all_sizes`, `pd_estilo`, `pd_tags`): separate multiple
> values with a pipe character `|`. A single value is also valid. Example: `azul|negro|crema`

---

### 8.5 Field Values Quick Reference

Use these exact option keys (the second column) in your CSV — not the display names.

#### Category IDs

Use these IDs in `pd_categoryLevel1`, `pd_categoryLevel2`, and `pd_categoryLevel3`.

| Category                    | ID to use                      |
| --------------------------- | ------------------------------ |
| **Level 1**                 |                                |
| Ropa                        | `ropa`                         |
| Bolsas                      | `bolsas`                       |
| Zapatos                     | `zapatos`                      |
| Accesorios                  | `accesorios`                   |
| Home Antiques               | `home_antiques`                |
| **Level 2 — Ropa**          |                                |
| Tops                        | `ropa-tops`                    |
| Camisetas                   | `ropa-camisetas`               |
| Camisas                     | `ropa-camisas`                 |
| Pantalones                  | `ropa-pantalones`              |
| Jeans                       | `ropa-jeans`                   |
| Faldas                      | `ropa-faldas`                  |
| Vestidos                    | `ropa-vestidos`                |
| Chamarras / Abrigos / Sacos | `ropa-sacos-chamarras`         |
| Sudaderas                   | `ropa-sudaderas`               |
| Shorts                      | `ropa-shorts`                  |
| Ropa deportiva              | `ropa-deportiva`               |
| Trajes / Sets               | `ropa-trajes`                  |
| Jumpsuits                   | `ropa-jumpsuits`               |
| Lencería / Pijama           | `ropa-lenceria`                |
| De baño                     | `ropa-debano`                  |
| Maternidad                  | `ropa-maternidad`              |
| **Level 2 — Bolsas**        |                                |
| De mano                     | `bolsas-mano`                  |
| Cruzadas                    | `bolsas-cruzadas`              |
| Clutch                      | `bolsas-clutch`                |
| Formales                    | `bolsas-formales`              |
| Mochilas casuales           | `bolsas-mochilas_casuales`     |
| Mochilas de deporte         | `bolsas-mochilas_deporte`      |
| Totes                       | `bolsas-totes`                 |
| Riñoneras                   | `bolsas-rinoneras`             |
| Carteras                    | `bolsas-carteras`              |
| Monederos                   | `bolsas-monederos`             |
| **Level 2 — Zapatos**       |                                |
| Tacones                     | `zapatos-tacones`              |
| Sandalias                   | `zapatos-sandalias`            |
| Sandalias con tacón         | `zapatos-sandalias_tacon`      |
| Zapatillas y Flats          | `zapatos-zapatillas_flats`     |
| Mocasines                   | `zapatos-mocasines`            |
| Plataformas                 | `zapatos-plataformas`          |
| Tenis casuales              | `zapatos-tenis_casuales`       |
| Tenis deportivos            | `zapatos-tenis_deportivos`     |
| Botas                       | `zapatos-botas`                |
| Botas vaqueras              | `zapatos-botas_vaqueras`       |
| Botas con tacón             | `zapatos-botas_tacon`          |
| Botas de montaña            | `zapatos-botas_montana`        |
| Botín                       | `zapatos-botin`                |
| Botín con tacón             | `zapatos-botin_tacon`          |
| **Level 2 — Accesorios**    |                                |
| Gorras / Gorros             | `accesorios-gorras_gorros`     |
| Sombreros                   | `accesorios-sombreros`         |
| Lentes                      | `accesorios-lentes`            |
| Cinturones                  | `accesorios-cinturones`        |
| Bufandas / Pañuelos         | `accesorios-bufandas_panuelos` |
| Joyerías                    | `accesorios-joyerias`          |
| Guantes                     | `accesorios-guantes`           |
| Otros                       | `accesorios-otros`             |
| **Level 3 — Tops**          |                                |
| Blusas                      | `ropa-tops-blusas`             |
| T-shirts                    | `ropa-tops-tshirts`            |
| Crop-tops                   | `ropa-tops-croptops`           |
| Manga larga                 | `ropa-tops-mangalarga`         |
| Manga corta                 | `ropa-tops-mangacorta`         |
| Strapless                   | `ropa-tops-strapless`          |
| Bodys                       | `ropa-tops-bodys`              |
| **Level 3 — Camisetas**     |                                |
| Manga corta                 | `ropa-camisetas-mangacorta`    |
| Manga larga                 | `ropa-camisetas-mangalarga`    |
| Sin mangas                  | `ropa-camisetas-sinmangas`     |
| Oversized                   | `ropa-camisetas-oversized`     |
| Gráficas / Estampadas       | `ropa-camisetas-graficas`      |
| Básicas                     | `ropa-camisetas-basicas`       |
| **Level 3 — Camisas**       |                                |
| Manga corta                 | `ropa-camisas-mangacorta`      |
| Manga larga                 | `ropa-camisas-mangalarga`      |
| Vaqueras                    | `ropa-camisas-vaqueras`        |
| Formales                    | `ropa-camisas-formales`        |
| Casuales                    | `ropa-camisas-casuales`        |
| Seda                        | `ropa-camisas-seda`            |
| **Level 3 — Pantalones**    |                                |
| Formales                    | `ropa-pantalones-formales`     |
| Casuales                    | `ropa-pantalones-casuales`     |
| Leggings                    | `ropa-pantalones-leggings`     |
| Sweatpants                  | `ropa-pantalones-sweatpants`   |
| Vintage                     | `ropa-pantalones-vintage`      |
| Cargo                       | `ropa-pantalones-cargo`        |
| **Level 3 — Jeans**         |                                |
| Mom fit                     | `ropa-jeans-momfit`            |
| Boyfriend jeans             | `ropa-jeans-boyfriend`         |
| Baggy / Oversized           | `ropa-jeans-baggy`             |
| Rectos                      | `ropa-jeans-rectos`            |
| Wide leg                    | `ropa-jeans-wideleg`           |
| Carpenter / Cargo           | `ropa-jeans-cargo`             |
| Acampanados / Flare         | `ropa-jeans-acampanados`       |
| Slim fit                    | `ropa-jeans-slimfit`           |
| Skinny jeans                | `ropa-jeans-skinny`            |
| **Level 3 — Faldas**        |                                |
| Larga                       | `ropa-faldas-larga`            |
| Midi                        | `ropa-faldas-midi`             |
| Mini                        | `ropa-faldas-mini`             |
| Denim                       | `ropa-faldas-denim`            |
| Seda                        | `ropa-faldas-seda`             |
| **Level 3 — Vestidos**      |                                |
| Vestidos formales           | `ropa-vestidos-formales`       |
| Vestidos casuales           | `ropa-vestidos-casuales`       |
| Largos                      | `ropa-vestidos-largos`         |
| Midi                        | `ropa-vestidos-midi`           |
| Mini                        | `ropa-vestidos-mini`           |
| Manga larga                 | `ropa-vestidos-mangalarga`     |
| Manga corta                 | `ropa-vestidos-mangacorta`     |
| Sin manga                   | `ropa-vestidos-sinmanga`       |
| Novia / Bridal              | `ropa-vestidos-novia`          |
| **Level 3 — Joyerías**      |                                |
| Collares                    | `accesorios-joyerias-collares` |
| Aretes                      | `accesorios-joyerias-aretes`   |
| Anillos                     | `accesorios-joyerias-anillos`  |
| Pulseras                    | `accesorios-joyerias-pulseras` |
| Relojes                     | `accesorios-joyerias-relojes`  |

#### Color option keys

| Display name | Use this key   |
| ------------ | -------------- |
| Rojo         | `rojo`         |
| Rosa         | `rosa`         |
| Amarillo     | `amarillo`     |
| Naranja      | `naranja`      |
| Dorado       | `dorado`       |
| Plateado     | `plateado`     |
| Verde        | `verde`        |
| Azul         | `azul`         |
| Morado       | `morado`       |
| Negro        | `negro`        |
| Gris         | `gris`         |
| Blanco       | `blanco`       |
| Crema        | `crema`        |
| Café         | `cafe`         |
| Animal Print | `animal-print` |
| Floral       | `floral-print` |
| Multicolor   | `multicolor`   |

#### Género option keys

| Display name | Use this key |
| ------------ | ------------ |
| Mujer        | `mujer`      |
| Hombre       | `hombre`     |
| Unisex       | `unisex`     |

#### Estado option keys

| Display name       | Use this key         |
| ------------------ | -------------------- |
| Nuevo con etiqueta | `nuevo-con-etiqueta` |
| Nuevo sin etiqueta | `nuevo-sin-etiqueta` |
| Como nuevo         | `como-nuevo`         |
| Buen estado        | `buen-estado`        |
| Usado              | `usado`              |

#### Estilo option keys

| Display name        | Use this key        |
| ------------------- | ------------------- |
| Vintage             | `vintage`           |
| Urbano / Streetwear | `urbano_streetwear` |
| Fiesta / Noche      | `fiesta_noche`      |
| Formal              | `formal`            |
| Casual              | `casual`            |
| Boho                | `boho`              |
| Retro               | `retro`             |
| Oficina             | `oficina`           |
| Vacaciones          | `vacaciones`        |
| Seda                | `seda`              |

#### Talla option keys

| Display name | Use this key | Group    |
| ------------ | ------------ | -------- |
| Unitalla     | `unitalla`   | Estándar |
| XXS          | `xxs`        | Estándar |
| XS           | `xs`         | Estándar |
| S            | `s`          | Estándar |
| M            | `m`          | Estándar |
| L            | `l`          | Estándar |
| XL           | `xl`         | Estándar |
| XXL          | `xxl`        | Estándar |
| XXXL         | `xxxl`       | Estándar |
| MX 22        | `mx_22`      | MX       |
| MX 24        | `mx_24`      | MX       |
| MX 26        | `mx_26`      | MX       |
| MX 28        | `mx_28`      | MX       |
| MX 30        | `mx_30`      | MX       |
| MX 32        | `mx_32`      | MX       |
| MX 34        | `mx_34`      | MX       |
| MX 36        | `mx_36`      | MX       |
| MX 38        | `mx_38`      | MX       |
| MX 40        | `mx_40`      | MX       |
| MX 42        | `mx_42`      | MX       |
| MX 44        | `mx_44`      | MX       |
| US 00        | `us_00`      | US       |
| US 0         | `us_0`       | US       |
| US 2         | `us_2`       | US       |
| US 4         | `us_4`       | US       |
| US 6         | `us_6`       | US       |
| US 8         | `us_8`       | US       |
| US 10        | `us_10`      | US       |
| US 12        | `us_12`      | US       |
| US 14        | `us_14`      | US       |
| US 16        | `us_16`      | US       |
| 1X           | `curvy_1x`   | Curvy    |
| 2X           | `curvy_2x`   | Curvy    |
| 3X           | `curvy_3x`   | Curvy    |
| 4X           | `curvy_4x`   | Curvy    |
| 5X           | `curvy_5x`   | Curvy    |
| 6X           | `curvy_6x`   | Curvy    |

#### Brand option keys

The full brand list has 623 entries. The most common ones are listed here. For the complete list,
see `docs/data/brand.csv`.

| Brand                   | Key            | Brand         | Key             |
| ----------------------- | -------------- | ------------- | --------------- |
| Zara                    | `zara`         | Gucci         | `gucci`         |
| Mango                   | `mango`        | Louis Vuitton | `louis-vuitton` |
| H&M                     | `h-m`          | Prada         | `prada`         |
| LEVI'S                  | `levi-s`       | Chanel        | `chanel`        |
| Nike                    | `nike`         | Dior          | `dior`          |
| Adidas                  | `adidas`       | Valentino     | `valentino`     |
| Free People             | `free-people`  | Versace       | `versace`       |
| Reformation             | `reformation`  | Balenciaga    | `balenciaga`    |
| Anthropologie / Aritzia | `aritzia`      | Zimmermann    | `zimmermann`    |
| Stradivarius            | `stradivarius` | Isabel Marant | `isabel-marant` |
| Pull & Bear             | `pull-bear`    | Jacquemus     | `jacquemus`     |
| Bershka                 | `bershka`      | Ganni         | `ganni`         |
| Vintage (no brand)      | `vintage`      | Otros         | `otros`         |

---

### 8.6 Troubleshooting

| Problem                                  | Likely cause                                            | What to do                                                         |
| ---------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| "signed-in operator session" error       | You are not signed in                                   | Sign in with the allowlisted operator account                      |
| "not allowed" error                      | Your account is not in the server allowlist             | Ask the administrator to add your email or user ID                 |
| "expired action token" error             | The short-lived upload token expired                    | Reload the page and start the upload again                         |
| "ZIP contains no .csv file"              | CSV is missing from the archive                         | Make sure you included exactly one CSV file inside the ZIP         |
| "ZIP contains N .csv files"              | Multiple CSVs in the archive                            | Remove extra CSV files — only one is allowed                       |
| "Duplicate image filename"               | Two images share the same filename in different folders | Rename images so all filenames are unique across the entire ZIP    |
| Image "not found in uploaded files"      | Filename in the CSV doesn't match the image file        | Check spelling, case, and file extension — they must match exactly |
| Row fails with "missing required column" | A required `pd_*` field is empty                        | Fill in all required fields for that row                           |
| Row fails with "invalid price"           | Price is zero, negative, or not a number                | Enter a positive number like `450.00`                              |
| All rows fail with API error             | Integration API credentials are wrong                   | Contact your administrator to check the server configuration       |
| Job not found (after waiting)            | Job data expired                                        | Jobs expire after 1 hour. Re-run the import.                       |

---

## 9. Application Settings

These settings are configured in the server environment, not in the Console. They are set once by
the development team when deploying the application. This section explains what each setting does in
plain language.

### Marketplace identity

| Setting              | What it controls                                            |
| -------------------- | ----------------------------------------------------------- |
| **Marketplace name** | The name shown in the browser tab and emails                |
| **Marketplace URL**  | The full web address of the marketplace (no trailing slash) |

### Sharetribe connection

| Setting                           | What it controls                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Marketplace API Client ID**     | Identifies this app to Sharetribe. Found in Console → Build → Applications.                          |
| **Integration API Client ID**     | Allows server-side operations (bulk import, notifications). Found in Console → Build → Integrations. |
| **Integration API Client Secret** | The password for the Integration API. Keep this private.                                             |

### Payments

| Setting                    | What it controls                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stripe Publishable Key** | Connects to your Stripe account for payment processing. Use a test key (`pk_test_…`) for staging and a live key (`pk_live_…`) for production. Found in Console → Build → Payments. |

### Bulk import

| Setting                 | What it controls                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Bulk Import API Key** | The password operators enter to access the import tool. Set any strong random value. Share only with authorized operators.             |
| **Default Author ID**   | The Sharetribe UUID of the user assigned as seller when a CSV row doesn't specify one. Find a user's UUID in Console → Manage → Users. |
| **Listing Type**        | The listing type all imported listings are created as. Default: `av-listing`.                                                          |

### Email notifications

| Setting           | What it controls                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Brevo API Key** | Connects to your Brevo account for sending transactional emails (welcome emails, etc.).  |
| **Brevo List ID** | The newsletter list subscribers are added to when they use the newsletter signup form.   |
| **Sender Email**  | The "from" email address used for transactional emails (e.g. `hola@archinovintach.com`). |
| **Sender Name**   | The "from" display name used for emails (e.g. `Archivo Vintach`).                        |

### WhatsApp notifications

| Setting                      | What it controls                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **WhatsApp Access Token**    | The permanent access token from Meta Business Manager for sending WhatsApp messages.                       |
| **WhatsApp Phone Number ID** | The ID of the WhatsApp Business phone number sending messages.                                             |
| **Admin Phone**              | The operator's phone number that receives admin alerts (new user signups, etc.). Format: `+521XXXXXXXXXX`. |

> If any WhatsApp setting is missing, WhatsApp notifications are silently skipped — no error is
> shown.

### Seller earnings estimator

| Setting                            | What it controls                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Provider commission percentage** | The marketplace fee percentage charged to sellers. Shown in the earnings estimator when sellers set a price. Default: 10% |
| **Stripe fee percentage**          | The Stripe processing fee percentage. Default: 2.9%                                                                       |
| **Stripe fixed fee**               | The fixed Stripe fee per transaction in centavos. Default: 1500 (= MXN \$15.00)                                           |

These values are used to show sellers an estimate of their net earnings while creating a listing.
The actual fees charged are configured separately in Console → Build → Transactions.

---

## 10. Custom Translation Strings

Custom translation strings control operator-editable text throughout the app. They live in two
places:

- **App translation files** (`en_av.json` / `es_av.json`) — the baseline defaults shipped with the
  code. Updated by the development team.
- **Sharetribe Console → Content → Translations** — operator overrides. Console values take
  precedence over the app files.

### How to update a string in the Console

1. Go to **Console → Content → Translations**.
2. Use the search box to find the key you want (e.g. `AVWelcomePopup.vendedor.title`).
3. If the key already exists, click it and edit the value in the text field, then save.
4. If the key does not appear yet (common for per-section dynamic keys like
   `AVHero2.my-section.mobileBackgroundUrl`), click **Add translation**, enter the key exactly as
   shown in the tables below, type the value, and save.

Changes take effect on the next page load. A key left blank or not added at all causes that element
to be silently hidden — the app never shows a raw key string to users.

> **Two languages:** Add the same key in both English and Spanish tabs, or whichever languages your
> marketplace supports.

---

### Listing field controls

| Area           | Key                                    | English default       | Spanish default       | Operator note                                        |
| -------------- | -------------------------------------- | --------------------- | --------------------- | ---------------------------------------------------- |
| Listing card   | `AVListingCard.sizeLabel`              | `Size:`               | `Talla:`              | Prefix label before the size value on listing cards. |
| Size selector  | `ListingField.allSizes.group.standard` | `Clothing (Standard)` | `Ropa (Estándar)`     | Group heading for standard letter sizes.             |
| Size selector  | `ListingField.allSizes.group.mx`       | `Clothing (MX)`       | `Ropa (MX)`           | Group heading for Mexican numeric sizes.             |
| Size selector  | `ListingField.allSizes.group.us`       | `Clothing (US)`       | `Ropa (US)`           | Group heading for US numeric sizes.                  |
| Size selector  | `ListingField.allSizes.group.curvy`    | `Curvy Sizes`         | `Tallas Curvy`        | Group heading for curvy sizes.                       |
| Size selector  | `FieldGroupedMultiSelect.placeholder`  | `Select sizes…`       | `Selecciona tallas…`  | Empty field placeholder.                             |
| Size selector  | `FieldGroupedMultiSelect.clearAll`     | `Clear all`           | `Borrar todo`         | Clear all selected sizes button.                     |
| Size selector  | `FieldGroupedMultiSelect.expand`       | `Expand`              | `Expandir`            | Collapsed dropdown toggle label.                     |
| Size selector  | `FieldGroupedMultiSelect.collapse`     | `Collapse`            | `Contraer`            | Expanded dropdown toggle label.                      |
| Size selector  | `FieldGroupedMultiSelect.removeOption` | `Remove {label}`      | `Quitar {label}`      | Chip remove button. `{label}` is the selected size.  |
| Color selector | `FieldColorDropdown.placeholder`       | `Select colors…`      | `Selecciona colores…` | Empty color field placeholder.                       |
| Color selector | `FieldColorDropdown.title`             | `Select Color`        | `Seleccionar Color`   | Dropdown panel heading.                              |
| Color selector | `FieldColorDropdown.close`             | `Close`               | `Cerrar`              | Dropdown close button.                               |

### Listing form — photos and pricing

| Area                   | Key                                               | English default                                             | Spanish default                                                | Operator note                                            |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| Photo upload (inline)  | `EditListingDetailsPanel.photosTitle`             | `Photos`                                                    | `Fotos`                                                        | Section heading above the inline photo uploader.         |
| Photo upload (inline)  | `EditListingDetailsPanel.photosMinRequired`       | `Add at least 3 photos to continue.`                        | `Agrega al menos 3 fotos para continuar.`                      | Validation message when too few photos are uploaded.     |
| Photo upload (inline)  | `EditListingDetailsPanel.photosAddTip`            | `You can add up to 100 photos.`                             | `Puedes agregar hasta 100 fotos.`                              | Helper text under the uploader.                          |
| Photo upload (inline)  | `EditListingDetailsPanel.photosMaxReached`        | `Maximum of 100 photos reached.`                            | `Has alcanzado el máximo de 100 fotos.`                        | Shown when the photo limit is hit.                       |
| Photo upload (inline)  | `EditListingDetailsPanel.photosUploadInProgress`  | `Please wait for all photos to finish uploading.`           | `Espera a que terminen de subir todas las fotos.`              | Shown while photos are still uploading.                  |
| Photo upload (slots)   | `EditListingPhotosForm.slotLabel.front`           | `Front`                                                     | `Frente`                                                       | Label for the front-photo slot.                          |
| Photo upload (slots)   | `EditListingPhotosForm.slotLabel.back`            | `Back`                                                      | `Trasera`                                                      | Label for the back-photo slot.                           |
| Photo upload (slots)   | `EditListingPhotosForm.slotLabel.horizontal`      | `Horizontal`                                                | `Horizontal`                                                   | Label for the horizontal-photo slot.                     |
| Photo upload (slots)   | `EditListingPhotosForm.slotLabel.details`         | `Details`                                                   | `Detalles`                                                     | Label for the optional details-photo slot.               |
| Photo upload (slots)   | `EditListingPhotosForm.frontImageRequired`        | `The front photo is required.`                              | `La foto de frente es obligatoria.`                            | Validation when front photo is missing.                  |
| Photo upload (slots)   | `EditListingPhotosForm.minImagesRequired`         | `At least 3 photos are required (Front, Back, Horizontal).` | `Se requieren al menos 3 fotos (Frente, Trasera, Horizontal).` | Validation when required slots are empty.                |
| Photo upload (slots)   | `EditListingPhotosForm.addImagesTip`              | `Tip: Upload at least 3 good-quality photos.`               | `Tip: Sube al menos 3 fotos de buena calidad.`                 | Helper tip below the slot uploader.                      |
| Listing gallery labels | `ListingImageGallery.imageLabel.front`            | `Front`                                                     | `Frente`                                                       | Caption shown on the front photo in the listing gallery. |
| Listing gallery labels | `ListingImageGallery.imageLabel.back`             | `Back`                                                      | `Trasera`                                                      | Caption for the back photo.                              |
| Listing gallery labels | `ListingImageGallery.imageLabel.horizontal`       | `Horizontal`                                                | `Horizontal`                                                   | Caption for the horizontal photo.                        |
| Listing gallery labels | `ListingImageGallery.imageLabel.details`          | `Details`                                                   | `Detalles`                                                     | Caption for the details photo.                           |
| Original price field   | `EditListingPricingForm.originalPrice`            | `Original Price (optional)`                                 | `Precio original (opcional)`                                   | Label for the strike-through original price field.       |
| Original price field   | `EditListingPricingForm.originalPricePlaceholder` | `Add original price…`                                       | `Agrega el precio original…`                                   | Placeholder in the original price input.                 |
| Earnings estimator     | `EarningsEstimator.title`                         | `Estimated Earnings`                                        | `Ganancias estimadas`                                          | Card heading in the pricing panel.                       |
| Earnings estimator     | `EarningsEstimator.listingPrice`                  | `Listing price`                                             | `Precio del artículo`                                          | Row label for the listing price.                         |
| Earnings estimator     | `EarningsEstimator.marketplaceFeeLabel`           | `Marketplace fee`                                           | `Comisión del marketplace`                                     | Row label for the marketplace commission.                |
| Earnings estimator     | `EarningsEstimator.stripeFee`                     | `Payment processing`                                        | `Procesamiento de pago`                                        | Row label for the Stripe processing fee.                 |
| Earnings estimator     | `EarningsEstimator.yourEarnings`                  | `Your earnings`                                             | `Tus ganancias`                                                | Row label for the net earnings.                          |
| Earnings estimator     | `EarningsEstimator.enterPrice`                    | `Enter a price to see estimated earnings.`                  | `Ingresa un precio para ver tus ganancias estimadas.`          | Shown before a price is entered.                         |
| Earnings estimator     | `EarningsEstimator.disclaimer`                    | `This is an estimate. Actual fees may vary.`                | `Esto es un estimado. Las tarifas reales pueden variar.`       | Small disclaimer below the estimate.                     |
| Order breakdown        | `OrderBreakdown.providerCommissionFixed`          | `{marketplaceName} fixed fee`                               | `Tarifa fija de {marketplaceName}`                             | Line item label for the fixed provider commission.       |

### Search filters

| Area         | Key                             | English default | Spanish default | Operator note                              |
| ------------ | ------------------------------- | --------------- | --------------- | ------------------------------------------ |
| Brand filter | `BrandFilter.searchPlaceholder` | `Search brand…` | `Buscar marca…` | Placeholder inside the brand search input. |
| Size filter  | `SearchPage.groupedSizesLabel`  | `Size`          | `Talla`         | Sidebar grouped size filter label.         |

### Navigation

| Area                     | Key                                                   | English default      | Spanish default      | Operator note                                              |
| ------------------------ | ----------------------------------------------------- | -------------------- | -------------------- | ---------------------------------------------------------- |
| Topbar highlighted link  | `Topbar.custom.leftOne`                               | `Hot list`           | `Lista destacada`    | Label for the single highlighted link in the top bar.      |
| Topbar highlighted link  | `Topbar.custom.leftOneHref`                           | `?pub_tags=hot-list` | `?pub_tags=hot-list` | Search query URL for the highlighted link.                 |
| Topbar menu 1 label      | `Topbar.custom.menuOne`                               | `Shop`               | `Comprar`            | First dropdown menu label.                                 |
| Topbar menu 2 label      | `Topbar.custom.menuTwo`                               | `Explore`            | `Explorar`           | Second dropdown menu label.                                |
| Topbar menu 3 label      | `Topbar.custom.menuThree`                             | `Brands`             | `Marcas`             | Third dropdown menu label.                                 |
| Desktop profile menu     | `TopbarDesktop.myPurchasesLink`                       | `My Purchases`       | `Mis Compras`        | Profile dropdown link to the purchases page.               |
| Desktop profile menu     | `TopbarDesktop.mySalesLink`                           | `My Sales`           | `Mis Ventas`         | Profile dropdown link to the sales page.                   |
| Desktop profile menu     | `TopbarDesktop.myBalanceLink`                         | `My Balance`         | `Mi Balance`         | Profile dropdown link to the balance page.                 |
| Mobile menu              | `TopbarMobileMenu.myPurchasesLink`                    | `My Purchases`       | `Mis Compras`        | Mobile menu link to the purchases page.                    |
| Mobile menu              | `TopbarMobileMenu.mySalesLink`                        | `My Sales`           | `Mis Ventas`         | Mobile menu link to the sales page.                        |
| Mobile menu              | `TopbarMobileMenu.myBalanceLink`                      | `My Balance`         | `Mi Balance`         | Mobile menu link to the balance page.                      |
| Account sidebar tab      | `UserNav.myPurchases`                                 | `My Purchases`       | `Mis Compras`        | Tab label in the account navigation sidebar.               |
| Account sidebar tab      | `UserNav.mySales`                                     | `My Sales`           | `Mis Ventas`         | Tab label in the account navigation sidebar.               |
| Account sidebar tab      | `UserNav.myBalance`                                   | `My Balance`         | `Mi Balance`         | Tab label in the account navigation sidebar.               |
| Account settings sidebar | `LayoutWrapperAccountSettingsSideNav.profileTabTitle` | `Profile`            | `Perfil`             | Label for the Profile tab in the account settings sidebar. |

### Welcome popup (shown after first registration)

The popup is shown once to new sellers after they register. All fields are optional — leaving a key
blank hides that element. Fill them in via **Console → Content → Translations**.

**When it appears:** It is shown to sellers (account types `vendedor` and `vendedor-tienda`) who have
not yet completed onboarding. It is intentionally **not** shown on the signup page (`/signup`) so it
does not cover the "check your email" confirmation message displayed right after registration — it
appears on the first regular page the seller lands on instead.

**Buttons:** A button only appears when **both** its label and its URL are filled in (e.g.
`primaryButtonLabel` *and* `primaryButtonUrl`). Leave both blank to hide a button entirely. Clicking
either button — or closing the popup — marks onboarding as complete, so the popup will not appear again.

**Vendedor popup** (shown to users who registered with the `vendedor` account type):

| Key                                            | What it controls                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `AVWelcomePopup.vendedor.imageUrl`             | URL of the image displayed at the top of the popup. Use a direct image link (e.g. from your CDN). |
| `AVWelcomePopup.vendedor.eyebrow`              | Small uppercase label shown above the title (e.g. "Ya eres parte de Archivo").                     |
| `AVWelcomePopup.vendedor.title`                | Popup heading text.                                                                               |
| `AVWelcomePopup.vendedor.text`                 | Body paragraph below the title.                                                                   |
| `AVWelcomePopup.vendedor.primaryButtonLabel`   | Label for the first (primary) button.                                                             |
| `AVWelcomePopup.vendedor.primaryButtonUrl`     | URL the primary button links to (e.g. `/l/new` to go to the new listing form).                    |
| `AVWelcomePopup.vendedor.secondaryButtonLabel` | Label for the second (secondary) button.                                                          |
| `AVWelcomePopup.vendedor.secondaryButtonUrl`   | URL the secondary button links to (e.g. `/s` for the search page).                                |

**Vendedor-tienda popup** (shown to users who registered with the `vendedor-tienda` account type):

| Key                                                   | What it controls                                |
| ----------------------------------------------------- | ----------------------------------------------- |
| `AVWelcomePopup.vendedor-tienda.imageUrl`             | URL of the image at the top.                    |
| `AVWelcomePopup.vendedor-tienda.eyebrow`              | Small uppercase label shown above the title.    |
| `AVWelcomePopup.vendedor-tienda.title`                | Popup heading text.                             |
| `AVWelcomePopup.vendedor-tienda.text`                 | Body paragraph.                                 |
| `AVWelcomePopup.vendedor-tienda.primaryButtonLabel`   | Primary button label.                           |
| `AVWelcomePopup.vendedor-tienda.primaryButtonUrl`     | Primary button URL (e.g. `/admin/bulk-import`). |
| `AVWelcomePopup.vendedor-tienda.secondaryButtonLabel` | Secondary button label.                         |
| `AVWelcomePopup.vendedor-tienda.secondaryButtonUrl`   | Secondary button URL.                           |

> The popup is shown once per user. After they close it, it will not appear again.

### Landing and PageBuilder sections

| Area                | Key / pattern                             | English default               | Spanish default                        | Operator note                                                        |
| ------------------- | ----------------------------------------- | ----------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| AV carousels        | `AVCarousel.previous`                     | `Previous`                    | `Anterior`                             | Previous arrow label for listing, category, tag, and user carousels. |
| AV carousels        | `AVCarousel.next`                         | `Next`                        | `Siguiente`                            | Next arrow label.                                                    |
| Standard hero       | `AVHero.ctaFirstText`                     | `Explore now`                 | `Explore now`                          | First hero CTA button text (Console override).                       |
| Standard hero       | `AVHero.ctaFirstLink`                     | `/s?pub_tags=hot-list`        | `/s?pub_tags=hot-list`                 | First hero CTA link.                                                 |
| Standard hero       | `AVHero.ctaSecondText`                    | `Browse all`                  | `Browse all`                           | Second hero CTA text.                                                |
| Standard hero       | `AVHero.ctaSecondLink`                    | `/s`                          | `/s`                                   | Second hero CTA link.                                                |
| Multi-instance hero | `AVHero2.<sectionId>.cta1Text`            | Empty                         | Empty                                  | Add per section, e.g. `AVHero2.shop.cta1Text`.                       |
| Multi-instance hero | `AVHero2.<sectionId>.cta1Link`            | `/s`                          | `/s`                                   | Link used when `cta1Text` is set.                                    |
| Multi-instance hero | `AVHero2.<sectionId>.cta1Style`           | `primary`                     | `primary`                              | Style tokens such as `primary`, `secondary`, `blue`, `roundedFull`.  |
| Multi-instance hero | `AVHero2.<sectionId>.cta2Text`            | Empty                         | Empty                                  | Optional second CTA text.                                            |
| Multi-instance hero | `AVHero2.<sectionId>.cta2Link`            | `/s`                          | `/s`                                   | Link used when `cta2Text` is set.                                    |
| Multi-instance hero | `AVHero2.<sectionId>.cta2Style`           | `secondary`                   | `secondary`                            | Optional second CTA style tokens.                                    |
| Multi-instance hero | `AVHero2.<sectionId>.mobileBackgroundUrl` | Empty                         | Empty                                  | Optional mobile-specific background image URL.                       |
| Clickable hero      | `AVHero2.<sectionId>.bgLink`              | Empty                         | Empty                                  | Makes the entire hero section a link.                                |
| Video section       | `AVVideo.<sectionId>.videoUrl`            | Empty                         | Empty                                  | Direct video file URL (MP4) for `avVideo` sections.                  |
| Instagram grid      | `SectionInstaGrid.dialogLabel`            | `Instagram post`              | `Publicación de Instagram`             | Modal dialog accessible label.                                       |
| Instagram grid      | `SectionInstaGrid.closePost`              | `Close post`                  | `Cerrar publicación`                   | Modal close button label.                                            |
| Instagram grid      | `SectionInstaGrid.viewPost`               | `View Instagram post {index}` | `Ver publicación de Instagram {index}` | Grid cell button label. `{index}` is 1-based.                        |
| Instagram feed      | `InstagramFeed.dialogLabel`               | `Instagram post`              | `Publicación de Instagram`             | Modal dialog label for the Instagram feed block.                     |
| Instagram feed      | `InstagramFeed.closePost`                 | `Close post`                  | `Cerrar publicación`                   | Modal close button label.                                            |
| Instagram feed      | `InstagramFeed.viewPost`                  | `View Instagram post {index}` | `Ver publicación de Instagram {index}` | Grid cell button label. `{index}` is 1-based.                        |
| Instagram feed      | `InstagramFeed.mediaAlt`                  | `Instagram post`              | `Publicación de Instagram`             | Fallback image alt text when caption is missing.                     |
| Instagram feed      | `InstagramFeed.mute`                      | `Mute`                        | `Silenciar`                            | Video mute button aria label.                                        |
| Instagram feed      | `InstagramFeed.unmute`                    | `Unmute`                      | `Activar sonido`                       | Video unmute button aria label.                                      |
| Instagram feed      | `InstagramFeed.pause`                     | `Pause`                       | `Pausar`                               | Video pause button aria label.                                       |
| Instagram feed      | `InstagramFeed.play`                      | `Play`                        | `Reproducir`                           | Video play button aria label.                                        |
| Footer              | `Footer.belowSlogan`                      | Empty                         | Empty                                  | Optional extra line of text displayed below the footer slogan.       |

### PageBuilder block key patterns

| Area                    | Key / pattern                               | English default | Spanish default | Operator note                                                             |
| ----------------------- | ------------------------------------------- | --------------- | --------------- | ------------------------------------------------------------------------- |
| Two-buttons block       | `TwoButtons.<blockId>.titleEyebrow`         | Empty           | Empty           | Optional eyebrow above the block title.                                   |
| Two-buttons block       | `TwoButtons.<blockId>.cta1Text`             | —               | —               | First CTA text.                                                           |
| Two-buttons block       | `TwoButtons.<blockId>.cta1Link`             | —               | —               | First CTA link.                                                           |
| Two-buttons block       | `TwoButtons.<blockId>.cta1Style`            | Empty           | Empty           | Optional style tokens.                                                    |
| Two-buttons block       | `TwoButtons.<blockId>.cta2Text`             | —               | —               | Second CTA text.                                                          |
| Two-buttons block       | `TwoButtons.<blockId>.cta2Link`             | —               | —               | Second CTA link.                                                          |
| Two-buttons block       | `TwoButtons.<blockId>.cta2Style`            | Empty           | Empty           | Optional style tokens.                                                    |
| Photo slider block      | `PhotoSlider.<blockId>.image_1` … `image_4` | Empty           | Empty           | Image URLs for `photoSlider ::` blocks.                                   |

### Newsletter form

| Key                               | English default                                                                                                                                 | Spanish default                                                                                                                                                | Operator note                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `NewsletterForm.emailPlaceholder` | `Your Email`                                                                                                                                    | `Tu Email`                                                                                                                                                     | Email input placeholder.          |
| `NewsletterForm.disclaimerText`   | `By entering your email, you agree to receive promotional emails from Archivo Vintach per our Privacy Policy. You may unsubscribe at any time.` | `Al ingresar tu correo, aceptas recibir correos promocionales de Archivo Vintach y nuestra Política de Privacidad. Puedes darte de baja en cualquier momento.` | Disclaimer below the email field. |
| `NewsletterForm.successMessage`   | `Thanks! Please check your inbox.`                                                                                                              | `¡Gracias! Revisa tu bandeja de entrada.`                                                                                                                      | Shown after successful signup.    |
| `NewsletterForm.errorMessage`     | `Subscription failed. Try again later.`                                                                                                         | `Error en la suscripción. Inténtalo más tarde.`                                                                                                                | Server error state.               |
| `NewsletterForm.invalidEmail`     | `Please enter a valid email.`                                                                                                                   | `Introduce un email válido.`                                                                                                                                   | Client-side validation message.   |
| `NewsletterForm.networkError`     | `Network error. Try again.`                                                                                                                     | `Error de red. Inténtalo de nuevo.`                                                                                                                            | Network failure state.            |

### My Purchases, My Sales, My Balance pages

| Area            | Key                              | English default                                  | Spanish default                                          | Operator note           |
| --------------- | -------------------------------- | ------------------------------------------------ | -------------------------------------------------------- | ----------------------- |
| Purchases page  | `MyPurchasesPage.heading`        | `My Purchases`                                   | `Mis Compras`                                            | Page heading.           |
| Purchases page  | `MyPurchasesPage.loadingError`   | `Failed to load purchases. Please try again.`    | `No se pudieron cargar las compras. Inténtalo de nuevo.` | Error state.            |
| Purchases page  | `MyPurchasesPage.noResults`      | `You haven't made any purchases yet.`            | `Aún no has realizado ninguna compra.`                   | Empty state.            |
| Sales page      | `MySalesPage.heading`            | `My Sales`                                       | `Mis Ventas`                                             | Page heading.           |
| Sales page      | `MySalesPage.loadingError`       | `Failed to load sales. Please try again.`        | `No se pudieron cargar las ventas. Inténtalo de nuevo.`  | Error state.            |
| Sales page      | `MySalesPage.noResults`          | `You don't have any sales yet.`                  | `Aún no tienes ninguna venta.`                           | Empty state.            |
| Balance page    | `MyBalancePage.heading`          | `My Balance`                                     | `Mi Balance`                                             | Page heading.           |
| Balance page    | `MyBalancePage.loadingError`     | `Failed to load balance data. Please try again.` | `No se pudieron cargar los datos. Inténtalo de nuevo.`   | Error state.            |
| Balance page    | `MyBalancePage.noResults`        | `No transactions found.`                         | `No se encontraron transacciones.`                       | Empty state.            |
| Balance summary | `BalanceSummary.totalEarnings`   | `Total Earnings`                                 | `Ganancias totales`                                      | Summary card heading.   |
| Balance summary | `BalanceSummary.pending`         | `Pending`                                        | `Pendiente`                                              | Summary card heading.   |
| Balance summary | `BalanceSummary.cancelled`       | `Cancelled`                                      | `Cancelado`                                              | Summary card heading.   |
| Balance summary | `BalanceSummary.tabAllTime`      | `All Time`                                       | `Todo el tiempo`                                         | Time-range tab label.   |
| Balance summary | `BalanceSummary.tabCurrentMonth` | `This Month`                                     | `Este mes`                                               | Time-range tab label.   |
| Payout row      | `PayoutItem.gross`               | `Gross`                                          | `Bruto`                                                  | Column header.          |
| Payout row      | `PayoutItem.net`                 | `Net`                                            | `Neto`                                                   | Column header.          |
| Payout row      | `PayoutItem.statusCompleted`     | `Completed`                                      | `Completado`                                             | Status badge text.      |
| Payout row      | `PayoutItem.statusPending`       | `Pending`                                        | `Pendiente`                                              | Status badge text.      |
| Payout row      | `PayoutItem.statusCancelled`     | `Cancelled`                                      | `Cancelado`                                              | Status badge text.      |
| Filters         | `TransactionFilters.status`      | `Status`                                         | `Estado`                                                 | Filter label.           |
| Filters         | `TransactionFilters.process`     | `Type`                                           | `Tipo`                                                   | Filter label.           |
| Filters         | `TransactionFilters.dateFrom`    | `From`                                           | `Desde`                                                  | Date range start label. |
| Filters         | `TransactionFilters.dateTo`      | `To`                                             | `Hasta`                                                  | Date range end label.   |
| Filters         | `TransactionFilters.clearAll`    | `Clear filters`                                  | `Limpiar filtros`                                        | Clear button.           |
| Filters         | `TransactionFilters.all`         | `All`                                            | `Todos`                                                  | Status option.          |
| Filters         | `TransactionFilters.completed`   | `Completed`                                      | `Completado`                                             | Status option.          |
| Filters         | `TransactionFilters.pending`     | `Pending`                                        | `Pendiente`                                              | Status option.          |
| Filters         | `TransactionFilters.cancelled`   | `Cancelled`                                      | `Cancelado`                                              | Status option.          |
| Filters         | `TransactionFilters.purchase`    | `Purchase`                                       | `Compra`                                                 | Process type option.    |
| Filters         | `TransactionFilters.booking`     | `Booking`                                        | `Reserva`                                                | Process type option.    |
| Filters         | `TransactionFilters.negotiation` | `Negotiation`                                    | `Negociación`                                            | Process type option.    |

### Bulk import page

| Key                               | English default                                                | Spanish default                                                        | Operator note                                      |
| --------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| `BulkImportPage.heading`          | `Bulk Listing Import`                                          | `Importación Masiva de Listings`                                       | Page heading.                                      |
| `BulkImportPage.description`      | `Upload a single ZIP file containing your CSV and all images…` | `Sube un solo archivo ZIP con tu CSV y todas las imágenes…`            | Intro paragraph.                                   |
| `BulkImportPage.zipLabel`         | `ZIP File`                                                     | `Archivo ZIP`                                                          | Upload field label.                                |
| `BulkImportPage.zipHelp`          | `Pack your CSV and all images into a single .zip file…`        | `Empaca tu CSV y todas las imágenes en un solo archivo .zip…`          | Helper text below the upload field.                |
| `BulkImportPage.zipSelected`      | `Selected: {name}`                                             | `Seleccionado: {name}`                                                 | Shown after a file is selected.                    |
| `BulkImportPage.startImport`      | `Start Import`                                                 | `Iniciar Importación`                                                  | Primary action button.                             |
| `BulkImportPage.downloadTemplate` | `Download CSV Template`                                        | `Descargar Plantilla CSV`                                              | Template download link.                            |
| `BulkImportPage.uploading`        | `Uploading files...`                                           | `Subiendo archivos...`                                                 | Status while uploading.                            |
| `BulkImportPage.processing`       | `Processing...`                                                | `Procesando...`                                                        | Status while the server is working.                |
| `BulkImportPage.progress`         | `{processed} of {total} processed ({percent}%)`                | `{processed} de {total} procesados ({percent}%)`                       | Progress indicator text.                           |
| `BulkImportPage.completed`        | `Import completed`                                             | `Importación completada`                                               | Final status heading.                              |
| `BulkImportPage.succeeded`        | `{count} succeeded`                                            | `{count} exitosos`                                                     | Success count in the result summary.               |
| `BulkImportPage.failed`           | `{count} failed`                                               | `{count} fallidos`                                                     | Failure count in the result summary.               |
| `BulkImportPage.resultsTitle`     | `Created Listings`                                             | `Listings Creados`                                                     | Table heading for successful rows.                 |
| `BulkImportPage.errorsTitle`      | `Errors`                                                       | `Errores`                                                              | Table heading for failed rows.                     |
| `BulkImportPage.errorsCapped`     | `Some errors were omitted — only the first 200 are shown.`     | `Algunos errores fueron omitidos — solo se muestran los primeros 200.` | Shown when there are more than 200 errors.         |
| `BulkImportPage.tableRow`         | `Row`                                                          | `Fila`                                                                 | Error table column header.                         |
| `BulkImportPage.tableTitle`       | `Title`                                                        | `Título`                                                               | Results table column header.                       |
| `BulkImportPage.tableStatus`      | `Status`                                                       | `Estado`                                                               | Results table column header.                       |
| `BulkImportPage.tableError`       | `Error`                                                        | `Error`                                                                | Error table column header.                         |
| `BulkImportPage.newImport`        | `New Import`                                                   | `Nueva Importación`                                                    | Button to start another import after one finishes. |
| `BulkImportPage.errorNoZip`       | `Please select a ZIP file.`                                    | `Selecciona un archivo ZIP.`                                           | Validation message.                                |
