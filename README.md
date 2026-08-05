# votronix

Official CycloNex Ecosystem Website/Votronix.

## Votronix Console

The `votronix-console/` folder is a static HTML interface for the local Votronix Python app. It can be hosted from GitHub Pages, but it expects the Votronix Python bridge to be running on the laptop that owns the audio files, models, projects, and exports.

Start the bridge from the local Python Votronix project:

```powershell
python web_server.py
```

Then open the console and keep the API field set to:

```text
http://127.0.0.1:8765
```
