# llamaDesk

A fast, minimal **desktop** interface for chatting with your local [Ollama](https://ollama.com) models.

llamaDesk is built with **Tauri 2**. It runs as a native desktop application on Windows and Linux. Your prompts, files, and chat history never leave your machine.

## Features

- **Native desktop app** (small binary, low memory usage)
- **Streaming responses** with a Stop button and tokens-per-second readout
- **Voice input** (push-to-talk) powered by on-device Whisper via `tauri-plugin-stt` — works offline after a one-time model download
- **Image input** for vision models (attach, drag & drop, or paste)
- **Text and code file input** (`.txt`, `.md`, `.csv`, `.json`, `.py`, `.js`, and more — up to 1 MB)
- **Word documents (`.docx`)** — in-app text extraction via Mammoth
- **PDF text extraction** — text-layer PDFs via PDF.js; scanned PDFs via OCR (Tesseract) fallback
- **Chat history** saved locally, with search, rename, pin, and per-chat delete
- **Persistent document context** — files attached to a chat stay available for later messages in that chat
- **Message queue** — type and queue the next message while the model is still generating
- **Continue generating** on the latest reply
- **Context length warning** with one-click summarize of older messages
- **Custom model picker** that lists every model installed in Ollama
- **Markdown rendering** with code blocks (syntax highlighting), tables, sequential lists, headings, **KaTeX math**, and **Mermaid diagrams**
- **Reasoning display** (collapsible, state preserved while streaming) for models that return thinking
- **Copy** (rendered reply, without the Reasoning block) and **Regenerate** on every reply
- **Settings** for system prompt, temperature, Ollama address, and theme
- **Export / import chats** as JSON (from Settings — merge or replace)
- **Edit previous messages** — change a user message and regenerate from that point
- **Temporary chats** — not saved to history
- **In-app model management** — pull and delete Ollama models from Settings
- **Responsive layout** with collapsible sidebar

## Requirements

- [Ollama](https://ollama.com/download) installed and running
- At least one model pulled (`ollama pull llama3.2`)
- A working microphone if you use voice input
- For development / building from source:
  - [Node.js](https://nodejs.org/) (LTS)
  - [Rust](https://www.rust-lang.org/tools/install)
  - Platform-specific dependencies (see below and [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

For vision features you need a vision-capable model (`llama3.2-vision`, `llava`, `gemma3`, `qwen2.5vl`, etc.).

### Linux system packages (build / from source)

On Ubuntu / Debian:

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev \
  libasound2-dev \
  build-essential \
  cmake \
  pkg-config
```

- `libasound2-dev` is required for microphone capture (ALSA / `cpal`)
- `cmake` and `build-essential` are required to compile Whisper (`whisper-rs-sys`)

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

# 2. Install frontend tooling
npm install

# 3. Make sure Ollama is running
ollama serve          # skip if already running as a service
ollama pull llama3.2  # if you don't have a model yet

# 4. Run the desktop app
npm run tauri dev
```

The first run compiles the Rust side (including Whisper). That can take several minutes. Later runs are much faster.

On first use of the microphone, the app downloads a small Whisper model (`base`) once. After that, voice input works fully offline.

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
| **Voice input**      | Mic button next to Attach → speak → click again (or `Esc`) to transcribe |
| Attach files         | Paperclip button, drag & drop, or paste an image |
| Switch model         | Model name at the bottom right of the input box  |
| New chat             | **New chat** in the sidebar                      |
| Regenerate a reply   | Refresh icon under the latest reply              |
| Settings             | Gear icon at the bottom of the sidebar           |

### Voice input

- Uses **on-device Whisper** (via [tauri-plugin-stt](https://github.com/brenogonzaga/tauri-plugin-stt)).
- Flow is **push-to-talk**: start → speak → stop → transcript is inserted into the input.
- First use downloads the `tiny` model (~75 MB) into the app data directory; later use is offline.
- Grant microphone permission when the OS prompts you.
- Works on Windows, macOS, and Linux.

### Attachments

- **Images** are resized (max side 1280 px), converted to JPEG, and sent to Ollama. The selected model must support vision.
- **Text files** up to 1 MB are inserted into the message as fenced blocks.
- **Word (`.docx`)** — text extracted in-app via Mammoth (up to 20 MB; ~200k characters).
- **PDFs** are extracted in-app:
  - Text PDFs: embedded text via PDF.js
  - Scanned / image PDFs: OCR via Tesseract.js (first OCR may download language data; later use is cached)
  - Limits: 40 MB file size, first 25 pages, ~100k characters
- **Math & diagrams** in replies: `$inline$` / `$$display$$` via KaTeX; ` ```mermaid ` fenced blocks via Mermaid.
- **Read aloud** uses the browser/OS speech engine (no cloud). Click the speaker icon on any reply.

## Configuration

Open **Settings** from the sidebar.

| Setting          | Description                                | Default                  |
|------------------|--------------------------------------------|--------------------------|
| Ollama address   | Base URL of the Ollama server              | `http://localhost:11434` |
| System prompt    | Instruction sent before every conversation | empty                    |
| Temperature      | Sampling temperature (0 – 2)               | `0.7`                    |
| Theme            | Dark / Light / System                      | Dark                     |

Settings and chats are stored in the app’s local storage.

## Project structure

```
LLamaDesk/
├── src/                         # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── highlight.min.js         # Code syntax highlighting
│   ├── highlight-dark.css
│   ├── highlight-light.css
│   ├── vendor/                  # PDF.js, Tesseract, Mammoth, KaTeX, Mermaid
│   │   ├── pdf.min.js
│   │   ├── pdf.worker.min.js
│   │   ├── tesseract.min.js
│   │   ├── mammoth.min.js
│   │   ├── katex.min.js / katex.min.css / fonts/
│   │   └── mermaid.min.js
│   └── Assets/
│       └── favicon.png
├── src-tauri/                   # Tauri / Rust backend
│   ├── src/
│   ├── icons/
│   ├── capabilities/
│   ├── Cargo.toml               # Includes tauri-plugin-stt
│   └── tauri.conf.json
├── .github/
│   └── workflows/
│       └── release.yml          # GitHub Actions release pipeline
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
git tag v0.1.1
git push origin v0.1.1
```

The workflow will:

- Install Linux build deps (including `libasound2-dev` and `cmake` for STT)
- Build Windows (`.msi` / `.exe`) and Linux (`.AppImage` / `.deb`) installers
- Create a GitHub Release and attach the installers

You can also trigger the workflow manually from the **Actions** tab → **Release** → **Run workflow**.

## How it works

llamaDesk talks directly to your local Ollama instance:

| Endpoint         | Purpose                                           |
|------------------|---------------------------------------------------|
| `GET /api/tags`  | List installed models                             |
| `POST /api/show` | Check whether a model supports vision             |
| `POST /api/chat` | Stream the model’s reply (newline-delimited JSON) |

Voice input is handled by the native STT plugin (Whisper). Audio never leaves your machine after the optional one-time model download.

Because it runs as a desktop app, there are **no CORS or origin issues**. It connects to `http://localhost:11434` (or whatever address you set in Settings).

## Troubleshooting

**"Can't reach Ollama"**  
- Make sure Ollama is running: `ollama serve` or check the system service.  
- Verify the address in Settings (default is `http://localhost:11434`).  
- Test with: `curl http://localhost:11434/api/tags`

**No models appear**  
Run `ollama pull llama3.2` (or any other model), then click **Reload models** in Settings.

**Image answers are empty / poor**  
The current model probably does not support vision. Switch to a vision model.

**Voice input / microphone**  
- Allow microphone access when the OS asks.  
- On first use, wait for the Whisper model download to finish (~75 MB).  
- Linux builds need `libasound2-dev` at compile time (included in the release workflow).  
- If transcription fails with “no speech”, speak a bit longer or check that the correct mic is selected in the OS.

**Linux build fails with `Package 'alsa' not found`**  
Install ALSA and build tools:

```bash
sudo apt-get install -y libasound2-dev build-essential cmake pkg-config
```

**Build fails (general)**  
Ensure you have installed all [Tauri system prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS and that Rust is up to date (`rustup update`). The first compile of Whisper can take several minutes.

**GitHub Actions release not appearing**  
- Confirm `.github/workflows/release.yml` is on the `main` branch.  
- Make sure the workflow has not been disabled.  
- Push a `v*` tag (e.g. `v0.1.1`) to trigger a release.

## Privacy

llamaDesk only talks to the Ollama address you configure. Voice models are downloaded from Hugging Face once and then used offline. The app loads no analytics or tracking. All chats stay on your machine.

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch.
2. Test on at least one desktop platform.
3. Open a pull request describing the change.

Bug reports and feature ideas are appreciated. Please include your OS, Ollama version, and the model you were using.

## Auto-updates

llamaDesk can update itself from [GitHub Releases](https://github.com/Nsoro-Allan/LLamaDesk/releases).

### How it works

1. On launch (and from **Settings → Check for updates**), the app requests `latest.json` from the latest GitHub Release.
2. If a newer version exists, the user is prompted to **Download & install**.
3. The installer is signature-checked with the public key in `src-tauri/tauri.conf.json`, then applied; the app restarts.

### Maintainers: signing keys (required)

Updates **must** be signed. Generate a keypair once:

```bash
npm run tauri signer generate -w ~/.tauri/llamadesk.key
```

- Put the **public** key string into `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.
- Store the **private** key in the GitHub repo secret `TAURI_SIGNING_PRIVATE_KEY` (full key contents).
- If you set a password on the key, also set `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

The release workflow already passes these secrets into `tauri-action` and uploads updater artifacts (`.sig` files + `latest.json`).

### Publishing a new update

1. Bump `version` in `package.json` and `src-tauri/tauri.conf.json` (and `Cargo.toml` if you keep them in sync).
2. Commit, tag, and push:

```bash
git tag v0.1.1
git push origin v0.1.1
```

3. Wait for the **Release** workflow to finish. Users on a signed build can then update in-app.

## License
Released under the [MIT License](LICENSE).
