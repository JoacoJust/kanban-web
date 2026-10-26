# Análisis de Requerimientos — DevBoard Web

Documento redactado para el cliente. Explica **qué** va a hacer la aplicación, qué **no**, y **cómo comprobamos** que está bien. Los detalles técnicos están en `docs/SPEC.md`.

## 1. Objetivo del producto

DevBoard es una aplicación web para organizar tareas en tableros tipo Kanban. Cada tablero tiene columnas ("Qué hacer", "Haciendo", "Hecho") y dentro de ellas, tarjetas (tickets) que se mueven de una columna a otra a medida que avanza el trabajo.

La aplicación es la **cara visible** de una API que ya existe y funciona (`kanban-api`). No se modifica la lógica del servidor.

## 2. Usuarios

Equipos o personas que quieren seguir el estado de sus tareas. Pensada para público técnico (desarrolladores), de ahí su estilo visual sobrio, tipo editor de código.

Como la API actual **no tiene usuarios ni contraseñas**, cualquier persona que abra la aplicación ve y edita los mismos tableros.

## 3. Alcance

### Incluido
- Crear, ver, editar y eliminar **tableros**.
- Crear, renombrar y eliminar **columnas**.
- Crear, editar y eliminar **tickets** (título y descripción).
- **Mover tickets** entre columnas arrastrándolos o con un menú "Mover a…".
- **Modo claro y modo oscuro**, con memoria de la elección.
- Mensajes de error claros en español.
- Publicación en internet (frontend y backend) y documentación.

### Fuera de alcance (no se hace)
- Inicio de sesión, usuarios, permisos (la API no los tiene).
- Prioridades, etiquetas, responsables, fechas límite (la API no guarda esos datos).
- Reordenar tickets dentro de una misma columna ni reordenar columnas.
- Búsqueda y filtros.
- Actualización en tiempo real entre varias personas.
- Funcionamiento sin conexión y otros idiomas.

## 4. Historias de usuario

| ID | Como… | Quiero… | Para… |
|---|---|---|---|
| HU-01 | usuario | ver la lista de mis tableros | elegir con cuál trabajar |
| HU-02 | usuario | crear un tablero con nombre y descripción | empezar un proyecto nuevo con sus 3 columnas básicas |
| HU-03 | usuario | editar o eliminar un tablero | mantener la lista ordenada |
| HU-04 | usuario | ver un tablero con sus columnas y tickets | conocer el estado del trabajo |
| HU-05 | usuario | agregar, renombrar y eliminar columnas | adaptar el flujo a mi equipo |
| HU-06 | usuario | crear, editar y eliminar tickets | registrar y mantener las tareas |
| HU-07 | usuario | mover un ticket a otra columna | reflejar que la tarea avanzó |
| HU-08 | usuario | que el movimiento se vea inmediato y se deshaga solo si falla | trabajar con fluidez y sin datos falsos |
| HU-09 | usuario | cambiar entre modo claro y oscuro | cuidar mi vista y mi preferencia |
| HU-10 | usuario | recibir avisos claros cuando algo falla | saber qué corregir |

## 5. Requerimientos funcionales

| ID | Requerimiento |
|---|---|
| RF-01 | Listar todos los tableros, del más nuevo al más antiguo. |
| RF-02 | Crear un tablero (nombre obligatorio, descripción opcional). Nace con las columnas "Qué hacer", "Haciendo" y "Hecho". |
| RF-03 | Editar nombre y descripción de un tablero. |
| RF-04 | Eliminar un tablero, pidiendo confirmación. Se borran también sus columnas y tickets. |
| RF-05 | Mostrar un tablero con sus columnas ordenadas y los tickets dentro de cada una. |
| RF-06 | Crear una columna (nombre obligatorio). |
| RF-07 | Renombrar una columna. |
| RF-08 | Eliminar una columna, pidiendo confirmación e indicando cuántos tickets se perderán. |
| RF-09 | Crear un ticket en una columna (título obligatorio, descripción opcional). |
| RF-10 | Editar título y descripción de un ticket. |
| RF-11 | Eliminar un ticket. |
| RF-12 | Mover un ticket a otra columna del mismo tablero, arrastrando o con el menú "Mover a…". |
| RF-13 | El movimiento se muestra al instante; si el servidor lo rechaza, el ticket vuelve a su columna original y aparece un aviso (Toast) con el motivo. |
| RF-14 | Si un formulario recibe un error del servidor, se muestra junto al campo o en el propio formulario, sin recargar la página. |
| RF-15 | Mientras se guarda algo, el botón queda deshabilitado y muestra un indicador de carga. |
| RF-16 | Modo claro y oscuro: respeta la preferencia del sistema la primera vez, se puede cambiar con un interruptor y se recuerda al recargar. |

## 6. Requerimientos no funcionales

| ID | Requerimiento |
|---|---|
| RNF-01 | **Estilo:** Minimalismo Developer (estilo editor/terminal), con paletas definidas para modo claro y oscuro. |
| RNF-02 | **Accesibilidad:** contraste de texto suficiente (WCAG AA) en ambos modos; uso con teclado; mover tickets también sin arrastrar. |
| RNF-03 | **Sin parpadeo:** al cargar, el tema correcto aparece desde el primer momento. |
| RNF-04 | **Responsive:** usable desde 360 px de ancho (celular) hasta escritorio. |
| RNF-05 | **Estados claros:** cada pantalla tiene estado de carga, de error y vacío. |
| RNF-06 | **Mantenibilidad:** código separado en capas (llamadas al servidor, componentes visuales, páginas). |
| RNF-07 | **Seguridad básica:** no se publican contraseñas ni archivos de configuración; la dirección del servidor se configura por variable de entorno. |
| RNF-08 | **Idioma:** toda la interfaz en español. |
| RNF-09 | **Documentación:** README de arquitectura para frontend y backend. |

## 7. Supuestos

1. El backend (`kanban-api`) está publicado y responde según su contrato actual.
2. No hay autenticación: se acepta que todos ven los mismos datos.
3. El servicio gratuito de hosting puede "dormirse"; la primera carga puede tardar hasta ~1 minuto.
4. Los límites de texto son los del servidor: nombre de tablero/columna 100, descripción de tablero 500, título de ticket 200, descripción de ticket 2000.
5. Los tickets no tienen prioridad porque el servidor no la guarda.

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El servidor gratuito tarda en despertar | La app parece colgada | Mensaje "Conectando con el servidor…" y tiempo de espera ampliado |
| Los errores del servidor no indican qué campo falló | Mensaje menos preciso en el formulario | Se asigna al campo por palabra clave; si no, error general del formulario |
| Falla de red al mover un ticket | Estado inconsistente | Rollback automático + Toast; la operación del servidor es repetible sin duplicar datos |
| Cualquier persona puede borrar datos (sin login) | Pérdida de información | Confirmación en eliminaciones; riesgo aceptado y declarado |
| Cambios del backend rompen el frontend | Pantallas con error | Contrato versionado en `docs/SPEC.md`; llamadas aisladas en `src/api` |

## 9. Criterios de aceptación

| ID | Criterio (Dado / Cuando / Entonces) | Cubre |
|---|---|---|
| CA-01 | Dado que hay tableros, cuando abro `/boards`, entonces los veo listados; si no hay, veo un mensaje vacío con botón "Crear tablero". | RF-01 |
| CA-02 | Cuando creo un tablero con nombre válido, entonces el sistema me lleva a ese tablero y veo las 3 columnas en orden. | RF-02 |
| CA-03 | Cuando envío el formulario de tablero sin nombre, entonces veo el error en el campo y no se envía nada. | RF-02, RF-14 |
| CA-04 | Cuando elimino un tablero y confirmo, entonces desaparece de la lista; si cancelo, no pasa nada. | RF-04 |
| CA-05 | Cuando abro `/boards/<id inexistente>`, entonces veo "Tablero no encontrado" con enlace a la lista. | RF-05 |
| CA-06 | Cuando creo un ticket sin título, entonces no se envía y veo el error en el campo "Título". | RF-09 |
| CA-07 | Cuando creo un ticket válido, entonces aparece al final de su columna sin recargar la página. | RF-09 |
| CA-08 | Cuando arrastro un ticket a otra columna, entonces cambia de columna al instante y al recargar sigue ahí. | RF-12 |
| CA-09 | Cuando muevo un ticket con el menú "Mover a…" (sin arrastrar), entonces obtengo el mismo resultado que arrastrando. | RF-12, RNF-02 |
| CA-10 | Cuando el servidor rechaza el movimiento (400/404), entonces el ticket vuelve a su columna original y veo un Toast con el motivo. | RF-13 |
| CA-11 | Mientras se guarda un formulario, el botón está deshabilitado y muestra un spinner; no se puede enviar dos veces. | RF-15 |
| CA-12 | Cuando elimino una columna con tickets, la confirmación indica cuántos se perderán. | RF-08 |
| CA-13 | Con el sistema en modo oscuro y sin elección previa, la primera carga es oscura. | RF-16 |
| CA-14 | Cuando cambio el tema y recargo, se mantiene, sin parpadeo del otro tema. | RF-16, RNF-03 |
| CA-15 | Los textos y botones cumplen contraste AA en ambos modos (verificado con herramienta). | RNF-02 |
| CA-16 | La interfaz es usable a 360 px de ancho, sin scroll horizontal de la página. | RNF-04 |
| CA-17 | La auditoría de límites negativos (ver `AGENTS.md` §11) no arroja violaciones. | RNF-06, RNF-07 |
| CA-18 | Frontend y backend están publicados y el flujo completo (crear tablero → crear ticket → moverlo → cambiar tema → recargar) funciona en producción. | Todos |

## 10. Cumplimiento de la consigna del trabajo

| Pedido de la consigna | Dónde se cumple |
|---|---|
| Repositorio nuevo con agente de IA | Repo `kanban-web` creado por el agente |
| Definir primero qué hacer; análisis para clientes | Este documento |
| Requerimientos en `.md` que el agente lea y respete | `AGENTS.md` + `docs/` |
| Un agente propone, otro verifica, otro implementa | Claude redacta → Devin revisa (`docs/REVIEW.md`) → persona aprueba → Devin implementa |
| Stack fijo, patrón presentacional/contenedor, estructura de carpetas | `AGENTS.md` §2–§4 |
| Matriz de rutas y límite negativo de `<Link>` | `AGENTS.md` §5 y §10; `docs/SPEC.md` §5 |
| React Hook Form + Zod, errores del backend en inputs, spinner | RF-14, RF-15; `AGENTS.md` §6 |
| Fases SDD (servicio → componentes → vistas) | `AGENTS.md` §11 |
| Optimistic UI con rollback y Toast | RF-13; `docs/SPEC.md` §7 |
| Mocks y `VITE_API_URL` | `docs/SPEC.md` §8; `AGENTS.md` §9 |
| Un estilo visual con modo claro/oscuro, tokens, `prefers-color-scheme`, `.dark`, `localStorage` | RNF-01, RF-16; `AGENTS.md` §8 |
| Desplegar backend y frontend | CA-18 |
| README de front y back con decisiones | RNF-09 |
