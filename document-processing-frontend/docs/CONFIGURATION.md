# Runtime configuration

## Browser and server configuration are deliberately separate

`app-config.json` is fetched before React renders and is visible to any browser user. It contains logical same-origin paths only. Caddy's four `*_API_ORIGIN` environment variables are server-side routing data and never enter the JavaScript bundle.

Do not place secrets, credentials, API keys, tokens, private DNS names, or real user data in either browser JSON file.

## `app-config.json`

- `version`: schema version; currently exactly `1`.
- `app`: display name (currently AXA-branded) and `fr`/`en` default locale.
- `mock`: explicit enable flag and one deterministic scenario.
- `features`: contextual chat and confidence visibility.
- `polling`: interval, maximum interval, local duration, and concurrent active task limit.
- `taskStatus`: Python/backend aliases mapped to canonical `queued`, `running`, `succeeded`, `failed`, and `cancelled` states. Case variants inside the same canonical state are allowed; the same alias cannot belong to two canonical states.
- `backends`: logical service names, `/backend/...` base paths, and route method/templates.

Every `{placeholder}` must be supplied exactly once by code. Unknown or missing parameters throw before fetch. Each segment uses `encodeURIComponent`; query values use `URLSearchParams` and are not pre-encoded.

To change a Python path or HTTP method, edit/mount the JSON and reload. To change a Python DTO, edit the corresponding adapter rather than adding DTO logic to JSX.

The browser configuration deliberately contains no PMO/PP filesystem paths. Configure those only on
the source/catalog service with `DOCUMENT_BACKEND_PMO_DATA_FOLDER` and
`DOCUMENT_BACKEND_PP_DATA_FOLDER`.

## `document-types.json`

The registry requires unique uppercase type codes, unique field keys within a type, localized labels, a safe data type, and integer display order. Formatter hints are declarative; they cannot execute code or inject HTML.

Known fields render in registry order. Backend fields not found in the registry render under **Autres champs**. Backend type codes not found in the registry receive an explicit unknown label. Empty configured fields remain visible as **Non renseigné**.

## Mount examples

Compose real mode already mounts:

```yaml
volumes:
  - ./deploy/config/app-config.real.json:/srv/config/app-config.json:ro
```

Mount a custom registry similarly:

```yaml
volumes:
  - ./my-document-types.json:/srv/config/document-types.json:ro
```

Caddy returns config files with `no-store`; a browser reload reads the new content. Invalid JSON or schema values produce a blocking configuration screen.

## Reverse proxy

`handle_path` removes only `/backend/source`, `/backend/catalog`, `/backend/processing`, or `/backend/chat`. It preserves the remaining route, query string, and HTTP method. Backend/PDF failures never fall through to `index.html`.
