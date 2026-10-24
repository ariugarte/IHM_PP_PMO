# OpenShift deployment (no Helm)

The image listens on port 8080, drops Linux capabilities, and is prepared for an arbitrary OpenShift UID. TLS terminates at the Route; Caddy does not request certificates.

Create the runtime ConfigMap. Both files are public browser configuration and must contain no secrets:

```bash
oc create configmap document-processing-frontend-config \
  --from-file=app-config.json=deploy/config/app-config.real.json \
  --from-file=document-types.json=public/config/document-types.json \
  --from-file=document-search-types.json=public/config/document-search-types.json \
  --dry-run=client -o yaml | oc apply -f -
```

Replace the image reference and service DNS names in `deployment.yaml`, then apply:

```bash
oc apply -f deploy/openshift/deployment.yaml
oc rollout status deployment/document-processing-frontend
oc get route document-processing-frontend
```

The four `*_API_ORIGIN` values are private server-side upstreams. Apply NetworkPolicies and authentication at the Python services or a trusted gateway. Do not put credentials or private origins in `app-config.json`.
