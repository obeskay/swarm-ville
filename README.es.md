<div align="center">

<img src="assets/banner-es.jpg" alt="SwarmVille — un bucle de agentes por el que puedes caminar" width="100%">

Cinco agentes, cinco cuartos, un pueblo. Mira el bucle mientras ocurre, en vez de leerlo después.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-20%2B-black)](https://nodejs.org)
[![Sin API key](https://img.shields.io/badge/API%20key-opcional-black)](#proveedores)

[English](README.md) · Español · [中文](README.zh-CN.md)

</div>

---

## El problema

Un bucle de agentes es un muro de texto. Planear, construir, revisar, corregir,
verificar: cinco llamadas al modelo que pasan más rápido de lo que puedes leerlas,
y cuando algo falla acabas subiendo por el log a ver cuál de los pasos se rompió.

La información nunca fue el problema. Lo era la **forma**. Un log es un mal medio
para algo que en realidad son cinco actores, un relevo y un ciclo.

Así que SwarmVille dibuja el bucle como un lugar. Atlas de pie en su escritorio del
cuarto de Plan, con un aro encendido a sus pies: eso es una llamada al modelo en
curso. Un arco entre Neo y Socrates: eso es el relevo. Socrates caminando de vuelta
hacia Neo: el revisor pidió corregir. No lees el estado, lo miras.

## Arranque

Node 20+.

```bash
npm install
npm run dev
```

Abre <http://127.0.0.1:5173>. Eso levanta Vite en el 5173 y el relay en el 8765;
Vite hace de proxy para `/api` y `/ws`, así que el navegador sólo habla con un
origen.

No hace falta ninguna API key. El proveedor `mock` que viene por defecto corre el
bucle entero sin conexión, ciclo de corrección incluido, así que el pueblo está
vivo desde el primer arranque.

Camina con **WASD** o haz clic en el suelo. Escribe un objetivo en la barra de
abajo y mira a los cinco agentes hacerlo.

## El bucle

```
plan ──▶ build ──▶ review ──┬── PASS ──▶ verify ──▶ archive
            ▲               │
            └─── REVISE ────┘   (con tope en MAX_REVISIONS)
```

Cada fase es una llamada al modelo hecha por un agente. El veredicto del revisor es
lo que cierra el ciclo: `VERDICT: REVISE` devuelve el control al constructor.

Cada objetivo recibe las mismas cinco llamadas, sea del tamaño que sea. Con
`DECOMPOSE=1` cambia la etapa de construcción: al planificador ya se le piden
pasos ordenados, así que el plan se lee como lista de tareas y el constructor las
toma de una en una —una llamada al modelo por paso, etiquetada `Build 2/4` en el
panel de la corrida—. Cuesta una llamada por paso, por eso viene apagado y por
eso no cambia nada más del bucle.

| Agente | Fase | Cuarto |
|---|---|---|
| Atlas | Planear | Plan |
| Neo | Construir | Build |
| Socrates | Revisar | Review |
| Vanguard | Verificar | Review |
| Alexandria | Archivar | Memory |

## Nada de lo que ves está inventado

Cada llamada al modelo queda registrada como un **paso**, y cada paso lleva su
latencia real, los tokens de entrada y de salida, el número de intento, la salida
completa y el motivo del fallo si falló. Dónde está parado un agente y si tiene el
aro encendido sale de esos mismos registros, no de una animación de progreso que
adivina.

El XP y las recompensas son estado del juego, propiedad del huerto. Nunca se
disfrazan de confianza del modelo ni de una nota de calidad inventada.

## El archivo

Las corridas viven en un búfer circular de 25 y mueren con el proceso, lo que
hacía de la fase de Alexandria el único paso del bucle que nadie podía volver a
leer. Ahora escribe una línea JSON por corrida terminada en
`.data/archive.jsonl` —el objetivo, su nota, el resultado y lo que costó— y el
cuarto de Memory es donde las relees. Haz clic en Alexandria, abre el archivo y
busca entre objetivos y notas.

JSONL y no una base de datos porque una línea es el registro entero, `tail -f`
funciona sobre él, y una línea corrupta te cuesta una corrida en vez del archivo
completo. Cámbialo de sitio con `ARCHIVE_FILE`.

## El huerto

El bucle jugable alrededor del bucle de agentes. Siembras un producto, lo mandas al
enjambre, y el plantío avanza por plan, diseño, construcción, revisión,
verificación y entrega conforme la ejecución emite pasos reales. Entre ejecuciones
lo riegas con energía, compras fertilizante en el mercado, completas encargos del
pueblo y cosechas la entrega para ganar monedas, gemas y XP.

Un plantío entregado abre el **Estudio de Producto**: editas el HTML, CSS,
JavaScript o README generado, publicas revisiones, las previsualizas en un iframe y
te descargas una app de un solo archivo lista para correr. El perfil y los plantíos
se guardan en el almacenamiento local del navegador.

## Una dirección para una entrega

El Estudio de Producto siempre supo armar una app de un solo archivo; el bucle
terminaba en tu carpeta de descargas y nada más. **Publish** escribe ese
documento en `.data/releases/` y el relay lo sirve en `/r/<id>`, así que un
plantío entregado es algo que puedes abrir en otra pestaña o pasarle a alguien de
la misma red.

A propósito no es Vercel ni GitHub. Una herramienta que escucha en `127.0.0.1` y
no tiene autenticación no tiene por qué guardar un token de despliegue. El
documento se sirve con `Content-Security-Policy: sandbox`, así que una entrega
corre pero no puede leer el almacenamiento de esta app — ver
[SECURITY.md](SECURITY.md).

## La plaza

Entra a la plaza y te unes a la sala: el relay te pasa la lista de quienes ya están
ahí y tu navegador abre una conexión WebRTC con cada uno. El audio y el video van
punto a punto — el relay sólo reenvía SDP e ICE.

Puedes rechazar el permiso de cámara sin problema: entras como oyente. El STUN
público cubre la misma máquina y la misma red local; cruzar un NAT simétrico
requiere un servidor TURN (mira `.env.example`).

## Proveedores

Elige uno en la barra superior, o pon `PROVIDER` en el `.env`.

| id | Qué es | Necesita |
|---|---|---|
| `mock` | Simulador sin conexión. El de por defecto. | nada |
| `ollama` | Modelos locales vía Ollama | Ollama corriendo en local |
| `anthropic` | Claude por la API de Anthropic | `ANTHROPIC_API_KEY` |

Las llaves las lee el relay del entorno y nunca llegan al navegador. Si un
proveedor no se puede construir, el relay cae a `mock` y marca el selector, en vez
de fallar en silencio.

## El arte

Cada tile, cada objeto y cada personaje están generados con `gpt-image-2` y luego
reducidos a una rejilla de píxeles. `art/manifest.json` guarda un prompt por asset,
`tools/genart.mjs` los genera y `tools/pixelize.py` recorta, reduce, endurece el
alfa, cuantiza a 64 colores y empaqueta un solo atlas. Las hojas de personaje son
una imagen con cuatro poses, separadas por las columnas vacías que quedan entre
ellas.

```bash
npm run art                        # genera lo que falte y vuelve a empaquetar
python3 tools/pixelize.py --selftest
```

Sólo se commitean `public/art/atlas.png` y `atlas.json`. Los 29 MB de imágenes
crudas son intermedios; regenerarlas cuesta alrededor de $1.40.

El renderer dibuja el mundo en un canvas fuera de pantalla a resolución de arte y
lo amplía por un factor entero, así todos los píxeles miden lo mismo y ninguno
queda a medio interpolar. Las etiquetas se dibujan después a resolución del
dispositivo, donde importa más que se lean que la pureza del píxel.

## API HTTP

El relay se usa sin la interfaz.

```bash
curl localhost:8765/api/health
curl localhost:8765/api/state
curl -X POST localhost:8765/api/runs \
  -H 'content-type: application/json' \
  -d '{"goal":"Añadir rate limiting a la API REST pública"}'
curl -X POST localhost:8765/api/runs/stop
curl 'localhost:8765/api/archive?q=rate%20limiting'
curl -X POST localhost:8765/api/releases -d '{"html":"<h1>hi</h1>"}'
```

El WebSocket en `/ws` empuja mensajes `snapshot`, `run`, `step`, `event`, `agent`,
`handoff`, `provider`, de presencia y de señalización WebRTC.

## Estructura

```
server/
  index.js          HTTP + WebSocket, middleware de seguridad
  orchestrator.js   el bucle de agentes
  archive.js        una línea JSON por corrida terminada
  releases.js       publica y sirve una entrega de un solo archivo
  security.js       límites de tasa, chequeo de origen, tope de cuerpo, saneo
  rooms.js          presencia + señalización WebRTC
  providers/        mock, ollama, anthropic
src/
  world/
    World.ts        el renderer 2D
    map.ts          el trazado del pueblo
    theme.ts        paleta, rejilla de tiles, rectángulos de los cuartos
    atlas.ts        cargador del spritesheet
  ui/               paneles, incluido el archivo
  lib/              cliente WebSocket, malla WebRTC
art/manifest.json   cada sprite con su prompt
tools/              generar el arte, empaquetar el atlas
assets/             banner y kit de marca
```

## Scripts

```bash
npm run dev        # relay + web
npm run relay      # sólo el relay
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + bundle de producción
npm run art        # regenerar el spritesheet
```

## Seguridad

Local por defecto: escucha en `127.0.0.1`, valida orígenes contra una lista, y
**no tiene autenticación**. Lee [SECURITY.md](SECURITY.md) antes de ponerlo en una
red.

## Licencia

MIT — ver [LICENSE](LICENSE).
