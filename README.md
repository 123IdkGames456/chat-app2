# Chat App 2 · Google Sheets edition

GitHub Pages serves the chat UI. Google Apps Script is the API, and the spreadsheet you supplied is the message database.

## Setup

1. Open the spreadsheet: https://docs.google.com/spreadsheets/d/1w3yCZtxLh1cWSWadEEOq7NngDCxdFePN-5zp891iAYw/edit
2. Open **Extensions → Apps Script**.
3. Replace the editor's `Code.gs` with the complete code from [apps-script/Code.gs](apps-script/Code.gs) in this repository.
4. Save the script.
5. Choose **Deploy → New deployment → Web app**.
6. Set **Execute as: Me** and **Who has access: Anyone**, then deploy and authorize.
7. Open the deployed URL ending in `/exec` with `?action=setup` added to the end once. This creates the `Messages` tab and its headers in your sheet.
8. Open the GitHub Pages app, click **Settings**, paste the deployment URL (without `?action=setup`), then click **Save & close**.

The `Messages` tab uses columns: id, timestamp, room, name, device, text, image, avatar.

## Notes

- Text and compressed image attachments are stored in the sheet.
- The app polls about every 1.8 seconds. Apps Script + Sheets is near-live, not true WebSocket instant messaging.
- This is a small-group prototype. A public endpoint can be abused and is subject to Google quotas. Names are not authenticated; do not use it for sensitive messages.
- This Sheets edition currently includes text chat, rooms and image attachments. Voice/video calls and screen sharing are not included in this remake.
