# Changelog

All notable project changes are documented in this file.

## Unreleased

### Brand Migration: Negin Heal

Date: 2026-06-13

The application branding has been migrated to Negin Heal across the API, administration dashboard, documentation, and localized user-facing copy. Persian interface text now uses the English brand name, `Negin Heal`, consistently.

#### Updated Surfaces

- Application metadata now identifies the API package as `negin-heal-api` and the dashboard package as `negin-heal`.
- Dashboard browser title, package description, and keywords now reference Negin Heal.
- Persian authentication and layout locale strings now display `Negin Heal` in all brand-related copy.
- Swagger API documentation title, site title, production server URL, and commented contact metadata now use Negin Heal naming.
- Example environment configuration now uses `negin-heal` for the MongoDB database and MinIO bucket names.
- Quick start documentation now uses Negin Heal in headings, database examples, Docker container names, and production readiness messaging.
- Package lockfiles were updated to keep root package metadata aligned with the renamed packages.

#### Verification

- Confirmed no remaining matches for legacy brand spellings across the workspace.
- Confirmed edited files report no IDE linter diagnostics.
