# Airtable Setup Checklist

This checklist helps ensure your Airtable base is properly configured for the Game Worker Solidarity website.

## Tables Required

- [ ] **Solidarity Actions** table exists
- [ ] **Companies** table exists
- [ ] **Countries** table exists
- [ ] **Organising Groups** table exists
- [ ] **Categories** table exists
- [ ] **Blog Posts** table exists
- [ ] **Static Pages** table exists

## Critical Field Configuration

### Companies Table

- [ ] `Name` field (Single line text)
- [ ] `Summary` field (Long text)
- [ ] `Solidarity Actions` field (Link to another record → Solidarity Actions)
  - [ ] Linked record display shows "Name"
  - [ ] Allow linking to multiple records: Yes

### Solidarity Actions Table

- [ ] `Name` field (Single line text) - Required
- [ ] `Date` field (Date) - Required
- [ ] `slug` field (Single line text) - Required, must be lowercase alphanumeric with hyphens
- [ ] `Public` field (Checkbox) - Required
- [ ] `hasPassedValidation` field (Checkbox) - Automatically set by validation API
- [ ] `LastModified` field (Last modified time)
- [ ] `Company` field (Link to another record → Companies)
  - [ ] This should be the reverse link from Companies → Solidarity Actions
  - [ ] Allow linking to multiple records: Yes
- [ ] `companyName` field (Lookup or Rollup) - Optional but recommended
  - [ ] Looks up `Name` from linked `Company` records
- [ ] `Organising Groups` field (Link to another record → Organising Groups)
- [ ] `Country` field (Link to another record → Countries)
- [ ] `countryCode` field (Lookup) - Looks up country code from Country
- [ ] `countryName` field (Lookup) - Looks up country name from Country
- [ ] `Category` field (Link to another record → Categories)
- [ ] `CategoryName` field (Lookup) - Looks up category name
- [ ] `CategoryEmoji` field (Lookup) - Looks up category emoji
- [ ] `Location` field (Single line text) - City/location name
- [ ] `LocationData` field (Long text) - JSON data from OpenStreetMap (auto-populated)
- [ ] `Summary` field (Long text)
- [ ] `Link` field (URL)
- [ ] `Document` field (Attachments) - Images/documents
- [ ] `DisplayStyle` field (Single select) - Options: "Featured" or empty
- [ ] `cdn_urls` field (Long text) - Auto-populated, do not edit manually

### Countries Table

- [ ] `Name` field (Single line text)
- [ ] `countryCode` field (Single line text) - ISO 3166-1 alpha-2 code (e.g., "US", "GB")
- [ ] `Slug` field (Single line text)
- [ ] `Summary` field (Long text)
- [ ] `Solidarity Actions` field (Link to another record → Solidarity Actions)
- [ ] `Unions` field (Link to another record → Organising Groups)
- [ ] `unionNames` field (Lookup) - Looks up union names

### Organising Groups Table

- [ ] `Name` field (Single line text)
- [ ] `Full Name` field (Single line text)
- [ ] `slug` field (Single line text)
- [ ] `Country` field (Link to another record → Countries)
- [ ] `countryName` field (Lookup)
- [ ] `countryCode` field (Lookup)
- [ ] `IsUnion` field (Checkbox)
- [ ] `Website` field (URL)
- [ ] `Bluesky` field (Single line text)
- [ ] `Twitter` field (Single line text)
- [ ] `Solidarity Actions` field (Link to another record → Solidarity Actions)
- [ ] `LastModified` field (Last modified time)

### Categories Table

- [ ] `Name` field (Single line text)
- [ ] `Emoji` field (Single line text)
- [ ] `Summary` field (Long text)
- [ ] `Solidarity Actions` field (Link to another record → Solidarity Actions)

### Blog Posts Table

- [ ] `Title` field (Single line text)
- [ ] `Slug` field (Single line text)
- [ ] `ByLine` field (Single line text)
- [ ] `Date` field (Date)
- [ ] `Summary` field (Long text)
- [ ] `Body` field (Long text)
- [ ] `Image` field (Attachments)
- [ ] `Public` field (Checkbox)
- [ ] `cdn_urls` field (Long text) - Auto-populated

### Static Pages Table

- [ ] `Title` field (Single line text)
- [ ] `Slug` field (Single line text)
- [ ] `Summary` field (Long text)
- [ ] `Body` field (Long text)
- [ ] `Public` field (Checkbox)

## Views Configuration

### Solidarity Actions Table

- [ ] "Live" view exists (or configured via `AIRTABLE_TABLE_VIEW_SOLIDARITY_ACTIONS` env var)
  - [ ] Filters: `Public` is checked
  - [ ] Filters: `Name` is not empty
  - [ ] Filters: `Date` is not empty
  - [ ] Sort: By `Date` descending
- [ ] All lookup fields are visible in the view

### Companies Table

- [ ] "Grid view" exists
  - [ ] `Solidarity Actions` field is visible
  - [ ] Shows at least: Name, Summary, Solidarity Actions
  - [ ] Can see linked solidarity actions for each company

## Reverse Relationship Verification

- [ ] When you add a Solidarity Action to a Company's "Solidarity Actions" field, it automatically appears in that Solidarity Action's "Company" field
- [ ] When you add a Company to a Solidarity Action's "Company" field, it automatically appears in that Company's "Solidarity Actions" field

**If this doesn't work**, see [Airtable Company Events Reverse View documentation](./airtable-company-events-reverse-view.md) for troubleshooting.

## Data Validation

### Test Record

Create a test Solidarity Action record and verify:
- [ ] `slug` contains only lowercase letters, numbers, and hyphens (e.g., "test-action-123")
- [ ] `Public` is checked
- [ ] `Name` is filled in
- [ ] `Date` is set
- [ ] `Company` links to at least one company
- [ ] The company shows this action in its "Solidarity Actions" field

### API Validation

After creating test records:
- [ ] Visit `/api/solidarityActions` - Should return JSON with your test records
- [ ] Visit `/api/validateAirtableData` - Should validate all records and update `hasPassedValidation`
- [ ] Check that records with valid slugs have `hasPassedValidation` checked

## Permissions

- [ ] You have Editor or Creator permissions in the base
- [ ] The API key used in `.env.local` has access to all required tables
- [ ] Webhook is configured (run `/api/createOrRefreshAirtableWebhook` after setup)

## Environment Variables

In your `.env.local` or production environment:
- [ ] `AIRTABLE_API_KEY` is set (from [airtable.com/account](https://airtable.com/account))
- [ ] `AIRTABLE_BASE_ID` is set (from your base URL)
- [ ] `AIRTABLE_CDN_TABLE_ID` is set to your Solidarity Actions table ID
- [ ] `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are configured
- [ ] `BASE_URL` is set for webhooks

## Additional Resources

- [Detailed reverse view setup guide](./airtable-company-events-reverse-view.md)
- [Airtable API token configuration guide](./airtable_access_token_config.png)
- [Project README](../README.md)
- [Airtable Linked Records Guide](https://support.airtable.com/hc/en-us/articles/218734758)

## Troubleshooting

### Common Issues

**Problem**: Solidarity Actions don't appear on Companies
- Check that the "Solidarity Actions" field exists on Companies table
- Check that it's a linked record field pointing to the Solidarity Actions table
- Try manually linking a test record

**Problem**: Validation fails
- Check that `slug` matches the pattern: lowercase alphanumeric with hyphens only
- Use the pattern `^[a-z0-9]+(?:[-_][a-z0-9]+)*$`

**Problem**: Records don't appear on the website
- Verify `Public` is checked
- Verify `hasPassedValidation` is checked
- Check that `Name` and `Date` are filled in

**Problem**: Images don't load
- Check that `cdn_urls` field exists in tables with attachments
- Verify Cloudinary credentials are correct
- Manually trigger `/api/syncToCDN` to resync

---

## Need Help?

If you've completed this checklist and still experience issues:
1. Check the browser console for errors
2. Check the Next.js server logs
3. Verify your Airtable base structure matches the requirements
4. Contact the development team
