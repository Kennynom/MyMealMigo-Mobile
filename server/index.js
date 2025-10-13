require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple wrapper that fetches the config JSON server-side and returns
// an HTML page that initializes the webchat with the config inline.
app.get('/webchat-wrapper', async (req, res) => {
  try {
    // The config URL can be provided via query, or read from env BOTPRESS_CONFIG_URL.
    // If EXPO_PUBLIC_BOTPRESS_URL is set and points to a Botpress shareable page, it may include
    // a configUrl query param – try to extract it.
    let configUrl = req.query.configUrl || process.env.BOTPRESS_CONFIG_URL;

    if (!configUrl && process.env.EXPO_PUBLIC_BOTPRESS_URL) {
      try {
        const u = new URL(process.env.EXPO_PUBLIC_BOTPRESS_URL);
        const cfg = u.searchParams.get('configUrl');
        if (cfg) configUrl = cfg;
      } catch (e) {
        // ignore
      }
    }

    if (!configUrl) {
      return res.status(400).send('Missing configUrl');
    }

    const cfgResp = await fetch(configUrl);
    console.log('Fetching config URL:', configUrl, 'Status:', cfgResp.status);
    if (!cfgResp.ok) {
      const txt = await cfgResp.text().catch(() => '');
      console.error('Config fetch failed:', cfgResp.status, txt.slice(0, 500));
      return res.status(502).send('Failed to fetch config');
    }

    const configJson = await cfgResp.text();
    console.log('Config length:', configJson.length);

    res.set('Content-Type', 'text/html');
    // Try to parse config JSON to extract botId for convenience
    let parsed = null;
    try {
      parsed = JSON.parse(configJson);
    } catch (e) {
      // leave parsed null
    }

    const botIdValue = parsed && parsed.botId ? JSON.stringify(parsed.botId) : 'null';

    res.send(`<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <div id="bp-web-widget"></div>
    <script>
      try {
        // inject config inline so the client doesn't need to fetch it
        window.botpressWebChat = { config: ${configJson}, botId: ${botIdValue}, host: 'https://cdn.botpress.cloud' };
      } catch (e) {
        document.body.innerHTML = '<p>Failed to initialize webchat: ' + e.message + '</p>';
      }
    </script>
    <script src="/inject.js"></script>
  </body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => console.log(`Webchat wrapper listening on http://localhost:${PORT}`));

// Proxy the Botpress webchat inject script so the page can load it from the same origin.
app.get('/inject.js', async (req, res) => {
  try {
    const injUrl = 'https://cdn.botpress.cloud/webchat/v3.3/inject.js';
    const r = await fetch(injUrl);
    if (!r.ok) {
      res.status(502).send('Failed to fetch inject.js');
      return;
    }
    const body = await r.text();
    res.set('Content-Type', 'application/javascript');
    res.send(body);
  } catch (e) {
    console.error('inject proxy error', e);
    res.status(500).send('inject proxy error');
  }
});
