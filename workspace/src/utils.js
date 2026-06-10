// Orbit — shared helpers (demo project)
const fs = require("fs");
const path = require("path");

function loadSettings() {
  const file = path.join(__dirname, "..", "config", "settings.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

module.exports = { loadSettings, formatUptime };
