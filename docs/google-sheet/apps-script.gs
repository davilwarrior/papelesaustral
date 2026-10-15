/**
 * Papeles Austral: avisa al sitio cuando cambia el catálogo.
 *
 * Instalación (una sola vez):
 * 1. En el Sheet: Extensiones > Apps Script. Borra lo que haya y pega este archivo.
 * 2. Engranaje "Configuración del proyecto" > Propiedades del script > Agregar:
 *      SYNC_URL     https://papelesaustral.com/api/sync/prices
 *      SYNC_SECRET  (el mismo valor de SYNC_WEBHOOK_SECRET del .env)
 * 3. Ejecuta la función "instalar" una vez y acepta los permisos.
 *
 * Después de eso, cada edición programa una sincronización 2 minutos después
 * (si se siguen editando celdas, se vuelve a posponer). También queda el menú
 * "Papeles Austral > Sincronizar ahora".
 */

var DELAY_MS = 2 * 60 * 1000;
var HANDLER = "sincronizar";

function instalar() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    ScriptApp.deleteTrigger(t);
  });
  var ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger("alEditar").forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger("alEditar").forSpreadsheet(ss).onChange().create();
  SpreadsheetApp.getUi().alert("Listo: el catálogo se sincronizará solo al editar.");
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Papeles Austral")
    .addItem("Sincronizar ahora", "sincronizarAhora")
    .addToUi();
}

/** Pospone la sincronización mientras se sigue editando. */
function alEditar() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) {
      return t.getHandlerFunction() === HANDLER;
    })
    .forEach(function (t) {
      ScriptApp.deleteTrigger(t);
    });
  ScriptApp.newTrigger(HANDLER).timeBased().after(DELAY_MS).create();
}

function sincronizarAhora() {
  var res = sincronizar();
  SpreadsheetApp.getUi().alert(res);
}

function sincronizar() {
  var props = PropertiesService.getScriptProperties();
  var response = UrlFetchApp.fetch(props.getProperty("SYNC_URL"), {
    method: "post",
    headers: { Authorization: "Bearer " + props.getProperty("SYNC_SECRET") },
    muteHttpExceptions: true,
  });
  var body = JSON.parse(response.getContentText() || "{}");
  var msg = body.ok
    ? "Sincronizado: " + body.productsSynced + " productos, " + body.rowsExcluded + " filas excluidas."
    : "Error al sincronizar: " + (body.error || response.getResponseCode());
  console.log(msg);
  return msg;
}
