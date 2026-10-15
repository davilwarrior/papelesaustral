# Configuración del Google Sheet

El sitio lee el Sheet **PORTAFOLIO WEB PAPELES AUSTRAL**. La cuenta de servicio solo tiene permiso de lectura, así que todo lo de aquí lo crea una persona a mano.

## Pestaña de productos: `CATALOGO PCC GRAFICO` (ya existe)

Solo se leen 4 columnas. Las demás se ignoran y se pueden seguir usando internamente.

| Columna | Encabezado | Uso en la web |
|---|---|---|
| A | `CODIGO SAMMI` | Identificador único del producto |
| B | `Descripción` | Nombre. De aquí se extraen marca, gramaje, medida y calibre |
| F | `PLIEGOS POR PAQUETE` | Pliegos que trae cada paquete |
| H | `PRECIO POR PAQUETES` | Precio final en USD. Vacío o `$ -` se muestra como "Consultar" |

Reglas para que la sincronización funcione:

- **No cambiar el nombre de la pestaña ni de esos 4 encabezados.** Sí se pueden agregar columnas nuevas.
- **Filas de sección:** una fila con texto solo en la columna A (por ejemplo `PAPEL BOND`) abre una línea. Los productos que siguen pertenecen a esa línea hasta la próxima sección.
- **El código debe ser único y no cambiar nunca.** Es lo que conecta los pedidos con el producto. En [4-codigos-por-corregir.tsv](4-codigos-por-corregir.tsv) hay 6 códigos repetidos y 65 productos sin código, con su número de fila.
- **Para que la descripción se lea bien,** escribir gramaje como `250gr`, medida como `70x100` o `A4`, y calibre como `calibre 14`.
- **Para quitar un producto de la web,** eliminar la fila. Si solo le falta el precio, se sigue mostrando con "Consultar".

## Pestañas nuevas que hay que crear

Cómo pegarlas: abre el archivo `.tsv` en VS Code o en el Bloc de notas, selecciona todo (Ctrl+A), copia y pega en la celda **A1** de la pestaña nueva. Google Sheets reparte las columnas solo.

### 1. `LINEAS`: [1-pestana-LINEAS.tsv](1-pestana-LINEAS.tsv)

Asigna cada sección del catálogo a una de las 4 familias del sitio.

| Columna | Qué va |
|---|---|
| `LINEA` | Texto exacto de la fila de sección (mayúsculas y tildes dan igual) |
| `FAMILIA` | `Papeles`, `Cartulinas`, `Cartones` o `Materiales especializados` |
| `NOMBRE WEB` | Cómo se muestra en el sitio |
| `ORDEN` | Orden dentro de la familia (menor primero) |

Si se crea una sección nueva en el catálogo y no se agrega aquí, la sincronización avisa y la deja como "Sin familia".

### 2. `TAGS`: [2-pestana-TAGS.tsv](2-pestana-TAGS.tsv)

Los tags son los usos que cruzan familias (por ejemplo "Antigrasa" agrupa papel Foopack y cartulina Earth Pact). Un producto recibe un tag si cumple cualquiera de estas condiciones:

| Columna | Qué va |
|---|---|
| `TAG` | Nombre visible del tag |
| `PALABRAS CLAVE` | Palabras separadas por coma. Si aparece una en la descripción del producto, recibe el tag. Se buscan palabras completas, sin importar mayúsculas ni tildes |
| `LINEAS` | Líneas completas que reciben el tag, separadas por coma |
| `DESCRIPCION` | Para qué sirve. Se muestra como ayuda y la usará el chatbot para recomendar productos |

### 3. `MARCAS`: [3-pestana-MARCAS.tsv](3-pestana-MARCAS.tsv)

| Columna | Qué va |
|---|---|
| `MARCA` | Nombre que se muestra en el filtro |
| `ALIAS` | Cómo puede aparecer escrita en la descripción, separados por coma |

**Revisar con el cliente:** agrupé Paper One y Boardone bajo **April**, Propalcote bajo **Propal** y Report bajo **Suzano**. Si prefieren verlas por separado, se cambia aquí sin tocar código.

## Sincronización con la web

El sitio guarda una copia del catálogo en Neon. Se actualiza de tres formas:

| Cómo | Cuándo |
|---|---|
| Apps Script ([apps-script.gs](apps-script.gs)) | 2 minutos después de la última edición del Sheet, o con el menú **Papeles Austral > Sincronizar ahora** |
| Cron de Vercel ([vercel.json](../../vercel.json)) | Todos los días a las 06:00 (hora de Ecuador), como respaldo |
| `npm run sync` | A mano, desde la terminal |

La instalación del Apps Script está explicada al inicio del archivo. Solo funciona con el sitio publicado, porque Google necesita una URL pública.

Reglas de la sincronización:

- **Se excluyen** las filas sin código, con código repetido o de secciones que no están en `LINEAS`. Se migran solas cuando se corrigen.
- **Si un producto sale del Sheet,** queda desactivado en la base (no se borra) y deja de verse en el cotizador.
- **Si el catálogo llega vacío o sin encabezados,** no se toca la base.
- **Para ver qué se excluiría** sin escribir nada:

  ```bash
  npm run sync:dry-run
  ```
