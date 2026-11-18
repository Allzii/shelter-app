const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Limit simultaneous transforms/file-map work on Windows to reduce EMFILE
// pressure when several clients request bundles from the same dev server.
if (process.platform === "win32") {
  config.maxWorkers = 2;
}

// These project-local folders are not part of the app. Retain Expo's own
// exclusions and leave source files, assets and dependencies available.
const rootPattern = __dirname
  .split(/[\\/]/)
  .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("[\\\\/]");
const excludedFolders = new RegExp(
  `^${rootPattern}[\\\\/](?:dist|web-build|output|supabase|\\.git)(?:[\\\\/]|$)`,
);
const defaults = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(defaults) ? defaults : defaults ? [defaults] : []),
  excludedFolders,
];

module.exports = config;
