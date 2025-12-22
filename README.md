# Newsletterify (Penpot → MJML Export)

Newsletterify is a Penpot plugin that builds MJML newsletters directly from Penpot boards and exports a ZIP containing the MJML + image assets.

## Install

1. Host the `/public` folder on GitHub Pages.
2. In Penpot, open **Plugins → Plugin Manager → Install from URL**.
3. Paste the manifest URL:
   
   `https://<user>.github.io/<repo>/manifest.json`

## Usage

### Build a newsletter

1. Click **Insert Container**.
2. Select the container, then click **Insert Row**.
3. Select the row, then click **Insert Column**.
4. With the column selected, insert **Text**, **Button**, **Image**, **Divider**, or **Spacer** modules.

### Export

1. Select the container.
2. Click **Export** to download `newsletterify-export.zip`.

### Component synergy (manual Penpot components)

You can build Penpot components manually and tag them to make them exportable:

1. Build the hierarchy manually: **container → section → column → leaf**.
2. Select a group or node and use **Tag Selection** in the plugin UI.
3. Assign the correct type (container, section, column, text, button, image, divider, spacer).
4. Provide JSON props (for example `{ "padding": "16px" }`).

## Development notes

- The UI is served from `public/index.html`.
- The runtime entrypoint is `public/plugin.js`.
- JSZip is stored locally at `public/vendor/jszip.min.js`.
