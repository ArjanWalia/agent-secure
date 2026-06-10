// Orbit — tiny status-page service (demo project)
const http = require("http");
const { loadSettings } = require("./utils");

const settings = loadSettings();

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: settings.serviceName }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`${settings.serviceName} is online\n`);
});

server.listen(settings.port, () => {
  console.log(`${settings.serviceName} listening on :${settings.port}`);
});
