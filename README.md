# Chat App 2 · Google Sheets edition

The GitHub Pages app is a static chat client. Google Apps Script is the lightweight API, and the supplied spreadsheet is the message database.

## Connect the spreadsheet

1. Open the spreadsheet: https://docs.google.com/spreadsheets/d/1w3yCZtxLh1cWSWadEEOq7NngDCxdFePN-5zp891iAYw/edit
2. Open **Extensions → Apps Script**.
3. In the Apps Script editor, replace the contents of `Code.gs` with the code in [apps-script/Code.gs](apps-script/Code.gs) in this repository.
4. Save. Run the `doGet` function is not required. To initialize the tab and header, open the Apps Script deployment URL after deployment with `?action=setup`, or run `setup_` from the editor (the helper is named with an underscore and may be hidden in the Run menu; if hidden, use the setup action below).
5. Select **Deploy → New deployment → Web app**.
6. Set **Execute as: Me** and access to **Anyone**. Deploy and authorize.
7. Copy the Web app URL ending in `/exec`.
8. Open the GitHub Pages site, click **Settings**, paste the URL and click **Save & close**.

The app creates/uses a tab named `Messages` with columns: id, timestamp, room, name, device, text, image, avatar.

## Notes

- Messages and image attachments are stored in the spreadsheet. Images are resized before upload.
- The client polls every ~1.8 seconds; Apps Script and Sheets are not WebSocket infrastructure, so this is near-live rather than true instant.
- This prototype is intended for a small private group. A public Apps Script endpoint can be abused and has Google quotas. Display names are not authenticated. Do not store sensitive information.
- The chat currently includes text, room names, local device identity and image attachments. Voice/video calls and screen sharing are not part of this Sheets-backed version.
