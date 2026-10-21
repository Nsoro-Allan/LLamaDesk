use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

struct TtsState {
    child: Mutex<Option<Child>>,
}

fn which(cmd: &str) -> bool {
    Command::new("sh")
        .arg("-c")
        .arg(format!("command -v {} >/dev/null 2>&1", cmd))
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

fn kill_child(state: &TtsState) {
    if let Ok(mut guard) = state.child.lock() {
        if let Some(mut c) = guard.take() {
            let _ = c.kill();
            let _ = c.wait();
        }
    }
}

/// Desktop TTS fallback when the webview has no SpeechSynthesis (common on Linux WebKitGTK).
/// Uses espeak-ng / espeak / spd-say on Linux, `say` on macOS, PowerShell Speech on Windows.
#[tauri::command]
fn speak_text(text: String, state: tauri::State<'_, TtsState>) -> Result<(), String> {
    kill_child(&state);

    let mut clean = text;
    if clean.len() > 8000 {
        clean.truncate(8000);
        clean.push('…');
    }
    if clean.trim().is_empty() {
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        let child = Command::new("say")
            .arg(&clean)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Could not start macOS say: {e}"))?;
        *state.child.lock().map_err(|e| e.to_string())? = Some(child);
        return Ok(());
    }

    #[cfg(target_os = "windows")]
    {
        let escaped = clean.replace('\'', "''");
        let script = format!(
            "Add-Type -AssemblyName System.Speech; \
             $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; \
             $s.Rate = 0; $s.Speak('{}')",
            escaped
        );
        let child = Command::new("powershell")
            .args(["-NoProfile", "-Command", &script])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Could not start Windows TTS: {e}"))?;
        *state.child.lock().map_err(|e| e.to_string())? = Some(child);
        return Ok(());
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let child = if which("espeak-ng") {
            Command::new("espeak-ng")
                .args(["-s", "160", "-v", "en", &clean])
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .map_err(|e| format!("Could not start espeak-ng: {e}"))?
        } else if which("espeak") {
            Command::new("espeak")
                .args(["-s", "160", "-v", "en", &clean])
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .map_err(|e| format!("Could not start espeak: {e}"))?
        } else if which("spd-say") {
            Command::new("spd-say")
                .args(["-r", "10", &clean])
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .map_err(|e| format!("Could not start spd-say: {e}"))?
        } else {
            return Err(
                "No system TTS found. On Ubuntu run: sudo apt install espeak-ng".into(),
            );
        };
        *state.child.lock().map_err(|e| e.to_string())? = Some(child);
        Ok(())
    }
}

#[tauri::command]
fn stop_speak(state: tauri::State<'_, TtsState>) -> Result<(), String> {
    kill_child(&state);
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_stt::init())
        .manage(TtsState {
            child: Mutex::new(None),
        })
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle()
                    .plugin(tauri_plugin_process::init())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, speak_text, stop_speak])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
