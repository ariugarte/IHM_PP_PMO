# Functional guide

## Goal and actors

The application lets an operations user choose a client profile, collect its contracts, choose which PDF documents to analyze, and inspect progressive classifier/OCR results without waiting for an entire batch. It orchestrates browser interactions only; filesystem access, OCR, classification, PDF storage, and AI answers belong to external Python services.

## Step 1 — Client

The user chooses exactly one client type:

- **Personne morale (PMO)** / **Legal entity (PMO)**.
- **Personne physique (PP)** / **Natural person (PP)**.

The browser submits only `{clientType}`. The backend maps `PMO` and `PP` to its separately configured directories, scans the selected directory, and returns a completed client-scoped workflow. There is no folder-path input and the request cannot choose an arbitrary path. The UI prevents duplicate submits and navigates only when normalized status is `succeeded` and a `workflowId` is known.

## Step 2 — Documents

The catalog service returns contracts and PDF documents for the workflow. A searchable multi-select determines which contracts are added to the analysis; newly added contracts initially include all their PDFs and all search types configured for the selected client profile. Each contract has a **Types de documents à rechercher** panel above its file list. The panel is collapsed by default and its checkboxes are independent for every contract. At least one type must remain selected for each contract that sends files to processing.

Each contract can select all file children, or refine individual documents with the normal checked/indeterminate/unchecked parent state. Search changes only the display and never discards selections. Each contract card shows up to five document rows before its grid becomes vertically scrollable.

**Visualiser** loads actual PDF bytes through the same-origin catalog route. Previewing has no effect on selection. **Lancer le traitement** shows a confirmation and sends only non-empty `{contractId, documentIds[], documentTypeIds[]}` groups.

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

During same-tab reload, `sessionStorage` restores the client type, workflow IDs, selected contract/document/search-type IDs, navigation, and task references. The app re-queries the catalog and task states. Sensitive extracted data, PDFs, chat messages, auth data, and tokens are not stored in Web Storage.

**Recommencer** confirms, clears the local workflow and TanStack Query cache, and stops monitoring the old references. It does not cancel a remote task.
