//! Shell natif de Savio : base SQLite locale, accès HTTP restreint au réseau local
//! (modèles IA locaux), et export des données de l'utilisateur.

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

const DATABASE_URL: &str = "sqlite:savio.db";

fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "schema initial",
        sql: include_str!("../../database/migrations/0001_init.sql"),
        kind: MigrationKind::Up,
    }]
}

/// Écrit un export JSON des données dans le dossier Téléchargements et renvoie son chemin.
/// Le nom de fichier est filtré pour empêcher toute écriture hors de ce dossier.
#[tauri::command]
fn save_export(
    app: tauri::AppHandle,
    file_name: String,
    contents: String,
) -> Result<String, String> {
    let safe: String = file_name
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
        .collect();
    if safe.is_empty() || safe.starts_with('.') || !safe.ends_with(".json") {
        return Err("Nom de fichier invalide".into());
    }
    let dir = app.path().download_dir().map_err(|e| e.to_string())?;
    let path = dir.join(safe);
    std::fs::write(&path, contents).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DATABASE_URL, migrations())
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![save_export])
        .run(tauri::generate_context!())
        .expect("erreur au lancement de Savio");
}
