# Functional guide

## Goal and actors

The application lets an operations user collect contracts, choose which PDF documents to analyze, and inspect progressive classifier/OCR results without waiting for an entire batch. It orchestrates browser interactions only; OCR, classification, GED access, PDF storage, and AI answers belong to external Python services.

## Step 1 — Source

The user chooses exactly one source:

- **Système de fichiers**: the `/data` alias configured by the Python service. This path is interpreted on the source service's host/container; it is not a browser-local folder upload.
- **GED**: one category (`Collective` or `Sinistres`) and at least one contract number loaded from the source API.

Submitting a filesystem source validates `/data` through the Python backend and navigates directly to Documents when the completed response contains a `workflowId`. GED creates an intake task: the UI prevents duplicate submits, polls its state, shows progress and transient errors, and unlocks **Continuer** only when the normalized status is `succeeded` and a `workflowId` is known. Failed, cancelled, timed-out, and network-error states never silently navigate forward.

## Step 2 — Documents

The catalog service returns contracts and PDF documents for the workflow. Each contract can select all children; selecting/deselecting one child produces the normal checked/indeterminate/unchecked parent state. Search changes only the display and never discards selections.

**Visualiser** loads actual PDF bytes through the same-origin catalog route. Previewing has no effect on selection. **Lancer le traitement** shows a confirmation and sends only non-empty `{contractId, documentIds[]}` groups.

The returned list may contain one or many tasks per contract/document mapping. Each task is monitored independently. **Voir les résultats** appears after the first success; other tasks keep progressing. Total failure leaves the user on this step with a clear retry path; partial failure preserves completed work.

## Step 3 — Results

The left navigation groups every submitted document by contract and shows its task state. The center renders the source PDF one page at a time. The right panel renders only the classifier and OCR data for that selected page.

The runtime registry supplies localized document-type labels, field labels, ordering, and formatting. The UI handles:

- mixed page types inside one PDF;
- optional confidence (never invented);
- missing values as **Non renseigné**;
- unregistered type codes with a safe fallback label;
- unregistered fields under **Autres champs**;
- raw OCR in a collapsed text panel;
- pending and failed documents alongside completed ones.

The contextual chat receives the workflow, selected contract, selected document, and current page. Source buttons in a reply navigate back to that document/page. The frontend does not claim to perform OCR, RAG, or classification itself.

## Reload and reset

During same-tab reload, `sessionStorage` restores workflow IDs, selected IDs, navigation, and task references. The app re-queries the catalog and task states. Sensitive extracted data, PDFs, chat messages, auth data, and tokens are not stored in Web Storage.

**Recommencer** confirms, clears the local workflow and TanStack Query cache, and stops monitoring the old references. It does not cancel a remote task.
