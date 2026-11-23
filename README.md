# Browser Notification Lab

A small React app that asks for browser notification permission and send notification on desktop and mobile phone

## What the app does

1. The page loads the `NotificationPermission` component.
2. The app registers a Service Worker from `public/service-worker.js`.
3. If notifications are not decided yet, the page shows **Allow notifications**.
4. When the button is clicked, the browser asks for notification permission.
5. After permission is granted, the app checks the time every 20 seconds.
6. At **4:38 PM** or later, it sends one notification for that day:
   - Title: `Test Message`
   - Message: `Have a great time!`
7. The app stores the last sent reminder in `localStorage`, so it does not
   send the same daily reminder more than once.

The time uses the device's local time zone.

## Requirements

- In Browser Notifiaction Setting should be enabled.

## Install and run

```bash
npm install
npm run dev
```

## Project structure

```text
.
├── index.html                    HTML entry page and PWA metadata
├── package.json                  Dependencies and npm commands
├── vite.config.js                Vite configuration
├── eslint.config.js              ESLint configuration
├── public/
│   ├── manifest.webmanifest      Installable-app/PWA settings
│   ├── service-worker.js         Notification click and worker lifecycle
│   ├── favicon.svg               Browser and manifest icon
│   └── icons.svg                 Public SVG asset
└── src/
    ├── main.jsx                  React entry point and worker registration
    ├── App.jsx                   Renders the notification component
    ├── components/
    │   └── NotificationPermission.jsx
    │                              Permission and reminder logic
    ├── index.css                 Global styles
    ├── App.css                   Additional/template styles
    └── assets/                   Image assets
```

## How the code works



### Permission handling

`NotificationPermission.jsx` first reads the current browser permission:

- `default`: permission has not been requested; the button is shown.
- `granted`: notifications are enabled; reminder checking starts.
- `denied`: notifications are blocked; the user must change browser settings.
- `unsupported`: the browser does not provide the Notification API.

Before asking for permission, the component checks:

- Notifications are available.
- Service Workers are available.
- The page is secure (`https` or `localhost`).
- On iPhone/iPad, the site is running as an installed Home Screen app.

The result or any error is displayed in a status message.

### Daily reminder

The reminder configuration is at the top of
`src/components/NotificationPermission.jsx`:

```js
const REMINDER_HOUR = 16;
const REMINDER_MINUTE = 38;
```

The component:

- Runs an immediate time check after permission is granted.
- Repeats the check every `20,000` milliseconds (20 seconds).
- Checks again when the page becomes visible.
- Builds a key from the current date and reminder time.
- Reads `lastSentReminderKey` from `localStorage`.
- Sends the reminder only when the current time is at or after 4:38 PM and
  today's key has not already been sent.

If sending succeeds, the key is saved. If sending fails, the key is removed so
the app can try again later.

### Service Worker

`public/service-worker.js`:

- Activates immediately during installation.
- Takes control of open pages during activation.
- Closes a notification when it is clicked.
- Focuses an existing app window, or opens `/` if no window exists.

The component uses the Service Worker registration's
`showNotification()` method to display the scheduled notification.

### PWA files

`public/manifest.webmanifest` gives the browser install information such as:

- App name and short name
- Start URL
- Standalone display mode
- Theme and background colors
- App icon

`index.html` links to the manifest, favicon, theme color, and Apple web-app
metadata.



## Changing the reminder

Edit these constants in `src/components/NotificationPermission.jsx`:

```js
const REMINDER_HOUR = 16;
const REMINDER_MINUTE = 38;
const NOTIFICATION_TITLE = "Test Message";
const NOTIFICATION_BODY = "Have a great time!";
```

Use 24-hour time for `REMINDER_HOUR`. For example, 9:15 AM is:

```js
const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 15;
```

If you change the reminder time while testing, remove the
`lastSentReminderKey` entry from browser storage or use a different day.
