import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  fr: { translation: {
    appName: 'Analyse documentaire AXA', demoMode: 'Mode démonstration', language: 'Langue', restart: 'Recommencer', proofOfConcept: 'Preuve de concept',
    stepSource: 'Client', stepDocuments: 'Documents', stepResults: 'Résultats',
    sourceTitle: 'Choisir le type de client', sourceSubtitle: 'Le service sélectionnera automatiquement le répertoire documentaire configuré pour ce profil.',
    clientTypeQuestion: 'Quel type de client souhaitez-vous analyser ?', clientTypeHelp: 'Aucun chemin de dossier n’est nécessaire : il est déterminé par la configuration du backend.',
    legalEntity: 'Personne morale (PMO)', legalEntityHelp: 'Entreprise, association ou autre entité juridique', naturalPerson: 'Personne physique (PP)', naturalPersonHelp: 'Particulier ou entrepreneur individuel',
    contracts: 'Contrats', selectContracts: 'Rechercher et sélectionner des contrats…',
    startAnalysis: "Démarrer l’analyse", intakeQueued: 'Collecte en attente', intakeRunning: 'Collecte en cours', intakeSuccess: 'Collecte terminée',
    continue: 'Continuer', retry: 'Réessayer', retryPolling: 'Reprendre la vérification', lastCheck: 'Dernière vérification',
    documentsTitle: 'Sélectionner les contrats et documents', documentsSubtitle: 'Ajoutez les contrats à l’analyse, puis affinez la sélection de leurs PDF.',
    contractsForAnalysis: 'Contrats à ajouter à l’analyse', contractSelectorHelp: 'Utilisez la recherche pour limiter la liste aux contrats utiles. Les documents restent modifiables contrat par contrat.',
    searchDocuments: 'Rechercher dans les contrats sélectionnés', selectAllContracts: 'Ajouter tous les contrats', clearContracts: 'Retirer tous les contrats', noContractsSelected: 'Sélectionnez au moins un contrat à ajouter à l’analyse.',
    documentTypesToSearch: 'Types de documents à rechercher', documentTypesSelected: '{{selected}} / {{total}} types sélectionnés', selectAllTypes: 'Tout sélectionner', clearTypes: 'Tout désélectionner', documentTypesRequired: 'Sélectionnez au moins un type de document à rechercher pour chaque contrat contenant des fichiers.',
    selectedSummary: '{{contracts}} contrat(s) / {{documents}} document(s) sélectionné(s)',
    pages: '{{count}} page(s)', view: 'Visualiser', launchProcessing: 'Lancer le traitement', confirmProcessing: 'Confirmer le traitement',
    confirmText: 'Les documents et types de recherche sélectionnés seront envoyés au service de traitement. Cette création de tâches ne sera pas relancée automatiquement.',
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
    appName: 'AXA document analysis', demoMode: 'Demo mode', language: 'Language', restart: 'Start over', proofOfConcept: 'Proof of concept',
    stepSource: 'Client', stepDocuments: 'Documents', stepResults: 'Results',
    sourceTitle: 'Choose the client type', sourceSubtitle: 'The service automatically selects the document directory configured for this profile.',
    clientTypeQuestion: 'Which client type do you want to analyze?', clientTypeHelp: 'No folder path is required: backend configuration determines it.',
    legalEntity: 'Legal entity (PMO)', legalEntityHelp: 'Company, association, or other legal organization', naturalPerson: 'Natural person (PP)', naturalPersonHelp: 'Individual or sole trader',
    contracts: 'Contracts', selectContracts: 'Search and select contracts…',
    startAnalysis: 'Start analysis', intakeQueued: 'Intake queued', intakeRunning: 'Intake running', intakeSuccess: 'Intake complete',
    continue: 'Continue', retry: 'Retry', retryPolling: 'Resume polling', lastCheck: 'Last check',
    documentsTitle: 'Select contracts and documents', documentsSubtitle: 'Add contracts to the analysis, then refine their PDF selection.',
    contractsForAnalysis: 'Contracts to add to the analysis', contractSelectorHelp: 'Use search to keep the list focused. Documents remain adjustable contract by contract.',
    searchDocuments: 'Search selected contracts', selectAllContracts: 'Add all contracts', clearContracts: 'Remove all contracts', noContractsSelected: 'Select at least one contract to add to the analysis.',
    documentTypesToSearch: 'Document types to search for', documentTypesSelected: '{{selected}} / {{total}} types selected', selectAllTypes: 'Select all', clearTypes: 'Clear all', documentTypesRequired: 'Select at least one document type to search for in each contract that contains selected files.',
    selectedSummary: '{{contracts}} contract(s) / {{documents}} document(s) selected',
    pages: '{{count}} page(s)', view: 'Preview', launchProcessing: 'Start processing', confirmProcessing: 'Confirm processing',
    confirmText: 'Selected documents and search types will be sent to processing. This task-creating request is never retried automatically.',
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
