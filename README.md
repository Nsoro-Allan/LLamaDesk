# llamaDesk

A fast, minimal **desktop** interface for chatting with your local [Ollama](https://ollama.com) models.

llamaDesk is built with **Tauri 2**. It runs as a native desktop application on Windows and Linux. Your prompts, files, and chat history never leave your machine.

## Features

- **Native desktop app** (small binary, low memory usage)
- **Streaming responses** with a Stop button and tokens-per-second readout
- **Image input** for vision models (attach, drag & drop, or paste)
- **Text and code file input** (`.txt`, `.md`, `.csv`, `.json`, `.py`, `.js`, and more)
- **Chat history** saved locally, with search and per-chat delete
- **Custom model picker** that lists every model installed in Ollama
- **Markdown rendering** with code blocks, tables, lists, and headings
- **Reasoning display** (collapsible) for models that return thinking
- **Copy** and **Regenerate** on every reply
- **Settings** for system prompt, temperature, Ollama address, and theme
- **Responsive layout** with collapsible sidebar

## Requirements

- [Ollama](https://ollama.com/download) installed and running
- At least one model pulled (`ollama pull llama3.2`)
- For development / building from source:
  - [Node.js](https://nodejs.org/) (LTS)
  - [Rust](https://www.rust-lang.org/tools/install)
  - Platform-specific dependencies (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

For vision features you need a vision-capable model (`llama3.2-vision`, `llava`, `gemma3`, `qwen2.5vl`, etc.).

## Download

Pre-built installers are available on the [Releases](https://github.com/Nsoro-Allan/LLamaDesk/releases) page.

| Platform | Package |
|----------|---------|
| Windows  | `.msi` / `.exe` |
| Linux    | `.AppImage` / `.deb` |

After installing, make sure Ollama is running, then open llamaDesk.

## Quick start (Development)

```bash
# 1. Clone the repository
git clone https://github.com/Nsoro-Allan/LLamaDesk.git
cd LLamaDesk

# 2. Install dependencies
npm install

# 3. Make sure Ollama is running
ollama serve          # skip if already running as a service
ollama pull llama3.2  # if you don't have a model yet

# 4. Run the desktop app
npm run tauri dev
```

The first run will compile the Rust side (can take a few minutes). Subsequent runs are fast.

## Building installers locally

```bash
npm run tauri build
```

Installers appear in:

```
src-tauri/target/release/bundle/
```

- **Windows** → `.msi` / `.exe`
- **Linux** → `.AppImage` / `.deb`

## App icon

The project uses `src/Assets/favicon.png` as the source icon.

To regenerate all platform icons:

```bash
npm run tauri icon src/Assets/favicon.png
```

This updates the files in `src-tauri/icons/`. Commit the generated icons so builds (including GitHub Actions) use the correct icon.

## Usage

| Action               | How                                              |
|----------------------|--------------------------------------------------|
| Send a message       | `Enter`                                          |
| New line             | `Shift` + `Enter`                                |
| Stop generating      | Click the stop button in the input box           |
| Attach files         | Paperclip button, drag & drop, or paste an image |
| Switch model         | Model name at the bottom right of the input box  |
| New chat             | **New chat** in the sidebar                      |
| Regenerate a reply   | Refresh icon under the latest reply              |
| Settings             | Gear icon at the bottom of the sidebar           |

### Attachments

- **Images** are resized (max side 1280 px), converted to JPEG, and sent to Ollama. The selected model must support vision.
- **Text files** up to 400 KB are inserted into the message as fenced blocks.
- **PDFs / Office documents** are not read directly. Convert them to text first (e.g. `pdftotext`).

## Configuration

Open **Settings** from the sidebar.

| Setting          | Description                               | Default                  |
|------------------|-------------------------------------------|--------------------------|
| Ollama address   | Base URL of the Ollama server             | `http://localhost:11434` |
| System prompt    | Instruction sent before every conversation| empty                    |
| Temperature      | Sampling temperature (0 – 2)              | `0.7`                    |
| Theme            | Dark / Light / System                     | Dark                     |

Settings and chats are stored in the app’s local storage.

## Project structure

```
LLamaDesk/
├── src/                    # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── Assets/
│       └── favicon.png
├── src-tauri/              # Tauri / Rust backend
│   ├── src/
│   ├── icons/
│   ├── capabilities/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── .github/
│   └── workflows/
│       └── release.yml     # GitHub Actions release pipeline
├── package.json
├── package-lock.json
├── LICENSE
└── README.md
```

## Releasing (GitHub Actions)

Releases are built automatically for **Windows** and **Linux** via GitHub Actions.

### Create a new release

1. Update the version in:
   - `package.json`
   - `src-tauri/tauri.conf.json`
2. Commit and push to `main`.
3. Create and push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow will:

- Build Windows (`.msi` / `.exe`) and Linux (`.AppImage` / `.deb`) installers
- Create a GitHub Release named **LLamaDesk v0.1.0**
- Attach the installers to the release

You can also trigger the workflow manually from the **Actions** tab → **Release** → **Run workflow**.

## How it works

llamaDesk talks directly to your local Ollama instance using these endpoints:

| Endpoint         | Purpose                                      |
|------------------|----------------------------------------------|
| `GET /api/tags`  | List installed models                        |
| `POST /api/show` | Check whether a model supports vision        |
| `POST /api/chat` | Stream the model’s reply (newline-delimited JSON) |

Because it runs as a desktop app, there are **no CORS or origin issues**. It simply connects to `http://localhost:11434` (or whatever address you set in Settings).

## Troubleshooting

**"Can't reach Ollama"**  
- Make sure Ollama is running: `ollama serve` or check the system service.  
- Verify the address in Settings (default is `http://localhost:11434`).  
- Test with: `curl http://localhost:11434/api/tags`

**No models appear**  
Run `ollama pull llama3.2` (or any other model), then click **Reload models** in Settings.

**Image answers are empty / poor**  
The current model probably does not support vision. Switch to a vision model.

**Build fails**  
Ensure you have installed all [Tauri system prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS and that Rust is up to date (`rustup update`).

**GitHub Actions release not appearing**  
- Confirm `.github/workflows/release.yml` is on the `main` branch.  
- Make sure the workflow has not been disabled.  
- Push a `v*` tag (e.g. `v0.1.0`) to trigger a release.

## Privacy

llamaDesk only talks to the Ollama address you configure. It loads no external fonts, scripts, analytics, or tracking. All chats stay on your machine.

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch.
2. Keep the frontend simple (vanilla JS preferred).
3. Test on at least one desktop platform.
4. Open a pull request describing the change.

Bug reports and feature ideas are appreciated. Please include your OS, Ollama version, and the model you were using.

## Roadmap ideas

- Export / import chats
- Rename chats and edit sent messages
- Temporary (non-persistent) chat mode
- In-app PDF text extraction
- Per-chat system prompts
- System tray support
- Auto-updater
- macOS builds (requires Apple Developer certificate)

## License

Released under the [MIT License](LICENSE).

## Acknowledgements

Built for use with [Ollama](https://ollama.com) and [Tauri](https://tauri.app).  
llamaDesk is an independent project and is not affiliated with or endorsed by Ollama or the Tauri project.
