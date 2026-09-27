# TryggNära

A mobile app project for people who need help reaching a shelter. The intended flow is for a wrist button to send a help request to nearby volunteers, who can accept or decline.

## Current state

The app currently contains a Swedish welcome screen and a role-selection screen. The welcome screen opens role selection; the information button and role choices are placeholders. Wrist-button integration, location matching, notifications, and accepting or declining requests are not implemented yet.

## Development

This project uses Expo SDK 57, React Native, TypeScript, Expo Router, and npm.

```sh
npm ci
npm start
```

Use `npm run android`, `npm run ios`, or `npm run web` to start Expo for a specific platform. The iOS simulator requires macOS.

```sh
npm run lint
npm run typecheck
```

Install new packages with `npx expo install <package>` to resolve SDK-compatible versions.

## Project structure

- `src/app/_layout.tsx`: root stack navigation.
- `src/app/index.tsx`: welcome screen.
- `src/app/role.tsx`: role selection.
- `assets/images/tryggnara.png`: welcome-screen logo.
- `app.json`: Expo configuration and launcher/splash assets.

Keep shared components, hooks, and utilities outside `src/app`, which is reserved for routes. Launcher icons and splash artwork still use the starter assets and need dedicated TryggNära artwork.

See the [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) for APIs matching this project.
