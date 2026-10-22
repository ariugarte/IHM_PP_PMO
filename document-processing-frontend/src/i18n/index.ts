import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  fr: { translation: {
    appName: 'Analyse documentaire', demoMode: 'Mode démonstration', language: 'Langue', restart: 'Recommencer',
    stepSource: 'Source', stepDocuments: 'Documents', stepResults: 'Résultats',
    sourceTitle: 'Choisir la source des documents', sourceSubtitle: 'Lancez une collecte asynchrone depuis un chemin serveur ou la GED.',
    filesystem: 'Système de fichiers', ged: 'GED', folderPath: 'Chemin du dossier', folderHelp: 'Chemin visible par le service Python (hôte ou conteneur), pas par votre navigateur.',
    category: 'Catégorie GED', collective: 'Collective', claims: 'Sinistres', contracts: 'Contrats', selectContracts: 'Rechercher des contrats…',
    startAnalysis: "Démarrer l’analyse", intakeQueued: 'Collecte en attente', intakeRunning: 'Collecte en cours', intakeSuccess: 'Collecte terminée',
    continue: 'Continuer', retry: 'Réessayer', retryPolling: 'Reprendre la vérification', lastCheck: 'Dernière vérification',
    documentsTitle: 'Sélectionner les documents', documentsSubtitle: 'Contrôlez les PDF puis choisissez exactement ceux à traiter.',
    search: 'Rechercher', selectAll: 'Tout sélectionner', selectNone: 'Tout désélectionner', selectedSummary: '{{contracts}} contrat(s) / {{documents}} document(s) sélectionné(s)',
    pages: '{{count}} page(s)', view: 'Visualiser', launchProcessing: 'Lancer le traitement', confirmProcessing: 'Confirmer le traitement',
    confirmText: 'Les documents sélectionnés seront envoyés au service de traitement. Cette création de tâches ne sera pas relancée automatiquement.',
    taskOverview: 'Suivi du traitement', queued: 'En attente', running: 'En cours', succeeded: 'Terminé', failed: 'Échec', cancelled: 'Annulé',
    seeResults: 'Voir les résultats', partialWarning: 'Des traitements ont échoué. Les résultats disponibles restent consultables.',
    allFailed: 'Toutes les tâches ont échoué. Ajustez la sélection puis lancez une nouvelle tentative.', noDocuments: 'Aucun document disponible.',
    resultsTitle: 'Résultats progressifs', resultsSubtitle: 'Les documents terminés sont disponibles sans attendre les autres tâches.',
    processing: 'En cours de traitement', rawOcr: 'Texte OCR brut', otherFields: 'Autres champs', notProvided: 'Non renseigné',
    unknownType: 'Type inconnu ({{code}})', confidence: 'Confiance {{value}} %', document: 'Document', page: 'Page {{current}} / {{total}}',
    previousPage: 'Page précédente', nextPage: 'Page suivante', zoomIn: 'Agrandir', zoomOut: 'Réduire', download: 'Télécharger', close: 'Fermer',
    loadingPdf: 'Chargement du PDF…', pdfError: 'Le PDF ne peut pas être affiché.', emptyResults: 'Aucun résultat terminé pour le moment.',
    chatTitle: 'Assistant contextuel', chatPlaceholder: 'Posez une question sur cette page…', send: 'Envoyer', chatEmpty: 'Les réponses utiliseront le document et la page actuellement sélectionnés.',
    configurationError: 'Configuration invalide', configurationErrorHelp: 'Corrigez les fichiers JSON montés dans /config puis rechargez la page.',
    networkError: 'Le service est momentanément inaccessible.', guardSource: 'Terminez la collecte avant de consulter les documents.',
    guardResults: 'Au moins une tâche doit être terminée avant d’ouvrir les résultats.', loading: 'Chargement…', noMatch: 'Aucun élément ne correspond à la recherche.',
    statusUnknown: 'État distant inconnu après expiration du délai. La tâche peut encore être active.', confirmRestart: 'Réinitialiser cette session locale ? Les tâches distantes ne seront pas annulées.',
    cancel: 'Annuler', confirm: 'Confirmer', contract: 'Contrat', filename: 'Fichier', pagesHeader: 'Pages', pageShort: 'p.{{page}}', status: 'Statut', actions: 'Actions', selected: 'Sélectionné',
  } },
  en: { translation: {
    appName: 'Document analysis', demoMode: 'Demo mode', language: 'Language', restart: 'Start over',
    stepSource: 'Source', stepDocuments: 'Documents', stepResults: 'Results',
    sourceTitle: 'Choose a document source', sourceSubtitle: 'Start an asynchronous intake from a server path or the DMS.',
    filesystem: 'File system', ged: 'DMS', folderPath: 'Folder path', folderHelp: 'Path visible to the Python service (host or container), not to your browser.',
    category: 'DMS category', collective: 'Collective', claims: 'Claims', contracts: 'Contracts', selectContracts: 'Search contracts…',
    startAnalysis: 'Start analysis', intakeQueued: 'Intake queued', intakeRunning: 'Intake running', intakeSuccess: 'Intake complete',
    continue: 'Continue', retry: 'Retry', retryPolling: 'Resume polling', lastCheck: 'Last check',
    documentsTitle: 'Select documents', documentsSubtitle: 'Review the PDFs, then choose exactly which ones to process.',
    search: 'Search', selectAll: 'Select all', selectNone: 'Select none', selectedSummary: '{{contracts}} contract(s) / {{documents}} document(s) selected',
    pages: '{{count}} page(s)', view: 'Preview', launchProcessing: 'Start processing', confirmProcessing: 'Confirm processing',
    confirmText: 'Selected documents will be sent to processing. This task-creating request is never retried automatically.',
    taskOverview: 'Processing status', queued: 'Queued', running: 'Running', succeeded: 'Completed', failed: 'Failed', cancelled: 'Cancelled',
    seeResults: 'View results', partialWarning: 'Some processing tasks failed. Available results remain usable.',
    allFailed: 'All tasks failed. Adjust the selection and start a new attempt.', noDocuments: 'No documents available.',
    resultsTitle: 'Progressive results', resultsSubtitle: 'Completed documents are available without waiting for other tasks.',
    processing: 'Processing', rawOcr: 'Raw OCR text', otherFields: 'Other fields', notProvided: 'Not provided',
    unknownType: 'Unknown type ({{code}})', confidence: 'Confidence {{value}}%', document: 'Document', page: 'Page {{current}} / {{total}}',
    previousPage: 'Previous page', nextPage: 'Next page', zoomIn: 'Zoom in', zoomOut: 'Zoom out', download: 'Download', close: 'Close',
    loadingPdf: 'Loading PDF…', pdfError: 'The PDF cannot be displayed.', emptyResults: 'No completed result yet.',
    chatTitle: 'Contextual assistant', chatPlaceholder: 'Ask about this page…', send: 'Send', chatEmpty: 'Answers use the currently selected document and page.',
    configurationError: 'Invalid configuration', configurationErrorHelp: 'Fix the mounted JSON files under /config and reload the page.',
    networkError: 'The service is temporarily unavailable.', guardSource: 'Complete intake before viewing documents.',
    guardResults: 'At least one task must complete before results can be opened.', loading: 'Loading…', noMatch: 'Nothing matches the search.',
    statusUnknown: 'Remote state is unknown after the polling timeout. The task may still be active.', confirmRestart: 'Reset this local session? Remote tasks will not be cancelled.',
    cancel: 'Cancel', confirm: 'Confirm', contract: 'Contract', filename: 'File', pagesHeader: 'Pages', pageShort: 'p.{{page}}', status: 'Status', actions: 'Actions', selected: 'Selected',
  } },
} as const;

export async function initializeI18n(locale: 'fr' | 'en') {
  await i18n.use(initReactI18next).init({ resources, lng: locale, fallbackLng: 'fr', interpolation: { escapeValue: false } });
  document.documentElement.lang = locale;
}

export default i18n;
