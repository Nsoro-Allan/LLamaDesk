# llamaDesk

A fast, minimal web interface for chatting with your local [Ollama](https://ollama.com) models.

llamaDesk is a single HTML file. There is nothing to install, no build step, no framework, and no external requests. Your prompts, files, and chat history stay on your machine.

## Features

- **Streaming responses** with a Stop button and a tokens-per-second readout
- **Image input** for vision models (attach, drag and drop, or paste from the clipboard)
- **Text and code file input** (`.txt`, `.md`, `.csv`, `.json`, `.py`, `.js`, and more) passed to the model as context
- **Chat history** saved in your browser, with search and per-chat delete
- **Custom model picker** that lists every model installed in Ollama, with parameter size and disk size
- **Markdown rendering** including code blocks with a Copy button, tables, lists, and headings
- **Reasoning display** as a collapsible section for models that return their thinking
- **Copy and Regenerate** actions on every reply
- **Settings** for system prompt, temperature, Ollama address, and theme (dark, light, or system)
- **Responsive layout** with a collapsible sidebar that becomes a drawer on small screens
- **Zero dependencies** and works offline once loaded

## Requirements

- [Ollama](https://ollama.com/download) installed and running
- At least one model pulled, for example `ollama pull llama3.2`
- A modern browser (Chrome, Edge, Firefox, Safari)
- Python 3 or any other static file server (only used to serve the page)

For image input, you also need a vision-capable model, such as `llama3.2-vision`, `gemma3`, `llava`, or `qwen2.5vl`.

## Quick start

```bash
# 1. Get the project
git clone https://github.com/Nsoro-Allan/llamadesk.git
cd llamadesk

# 2. Make sure Ollama is running
ollama serve        # skip this if Ollama already runs as a service

# 3. Pull a model if you don't have one yet
ollama pull llama3.2

# 4. Serve the page
python3 -m http.server 8080
```

Then open <http://localhost:8080> in your browser.

> **Do not open `index.html` by double-clicking it.** Browsers send a `null` origin for `file://` pages, and Ollama rejects that origin by default. Serving the file from `localhost` works without changing any Ollama settings.

Any static server works. For example, `npx serve .` or `php -S localhost:8080`.

## Usage

| Action | How |
| --- | --- |
| Send a message | `Enter` |
| New line | `Shift` + `Enter` |
| Stop generating | Click the stop button in the input box |
| Attach files | Paperclip button, drag and drop onto the window, or paste an image |
| Switch model | Model name at the bottom right of the input box |
| New chat | **New chat** in the sidebar |
| Regenerate a reply | Refresh icon under the latest reply |
| Settings | Gear icon at the bottom of the sidebar |

### Attachments

- **Images** are resized in the browser so the longest side is at most 1280 px, converted to JPEG, and sent to Ollama in the `images` field. The selected model must support vision.
- **Text files** up to 400 KB are inserted into your message as fenced blocks labelled with the file name.
- **PDFs and Office documents** are not read directly. Convert them to text first, for example with `pdftotext file.pdf` (from `poppler-utils`), then attach the result.
- Very large files can exceed the model's context window. If answers seem to ignore your file, increase `num_ctx` in the `options` object of the `/api/chat` request inside `index.html`.

## Configuration

Open **Settings** from the sidebar.

| Setting | Description | Default |
| --- | --- | --- |
| Ollama address | Base URL of the Ollama server | `http://localhost:11434` |
| System prompt | Instruction sent before every conversation | empty |
| Temperature | Sampling temperature, 0 to 2 | `0.7` |
| Theme | Dark, Light, or System | Dark |

Settings and chats are stored in your browser's `localStorage` under keys that start with `llamadesk.`.

## Using llamaDesk from another device

By default Ollama only listens on `127.0.0.1`. To reach it from a phone or another computer on your network:

```bash
sudo systemctl edit ollama
```

Add the following, save, then restart the service:

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_ORIGINS=*"
```

```bash
sudo systemctl restart ollama
```

Serve llamaDesk with `python3 -m http.server 8080 --bind 0.0.0.0`, open `http://<your-computer-ip>:8080` on the other device, and set **Ollama address** in Settings to `http://<your-computer-ip>:11434`.

> **Security:** Ollama has no authentication. Only do this on a network you trust, and never expose port 11434 to the public internet. If you need remote access, put it behind a VPN or an authenticating reverse proxy.

## Troubleshooting

**"Can't reach Ollama"**
Check that Ollama is running (`systemctl status ollama` or `ollama serve`) and that the address in Settings is correct. You can test it with `curl http://localhost:11434/api/tags`.

**The page loads but requests fail with a CORS error**
You are probably opening the file with `file://`, or serving it from an origin Ollama does not allow. Serve it from `localhost` as shown above, or add your origin to `OLLAMA_ORIGINS`.

**"No models installed"**
Pull one: `ollama pull llama3.2`, then choose **Reload models** in Settings.

**Image upload gives poor or empty answers**
The selected model probably does not support vision. Switch to a vision model.

**Chat history is not saved**
Your browser may block or limit `localStorage` (private windows, strict privacy settings, or a full quota of about 5 MB). Attached images are never saved to history, only a note that an image was attached.

## Privacy

llamaDesk makes requests only to the Ollama address you configure. It loads no fonts, scripts, analytics, or other external resources. Chats are stored locally in your browser and can be removed with **Settings > Delete all chats**.

## Project structure

```
llamadesk/
├── index.html    # the entire app: markup, styles, and scripts
├── README.md
└── LICENSE
```

## How it works

llamaDesk talks to three Ollama endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/tags` | List installed models |
| `POST /api/show` | Check whether the selected model supports vision |
| `POST /api/chat` | Stream the model's reply as newline-delimited JSON |

See the [Ollama API documentation](https://github.com/ollama/ollama/blob/main/docs/api.md) for details.

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch for your change.
2. Keep the project dependency-free and in a single file unless there is a strong reason to change that.
3. Test in at least one Chromium-based browser and one other browser, and check both the dark and light themes and a narrow mobile viewport.
4. Open a pull request that describes what changed and why.

Bug reports and feature ideas are welcome as issues. Please include your browser, Ollama version, and the model you were using.

## Roadmap ideas

- Export and import chats
- Rename chats and edit sent messages
- Temporary chat mode that is not saved
- In-browser PDF text extraction
- Per-chat system prompts

## License

Released under the [MIT License](LICENSE).

## Acknowledgements

Built for use with [Ollama](https://ollama.com). llamaDesk is an independent project and is not affiliated with or endorsed by Ollama.