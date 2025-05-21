import { useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { grafxStore } from '~/lib/stores/grafx';
import type {
  GrafxBasicSubscriptionModel,
  GrafxBasicEnvironmentModel,
  GrafxTemplateSummaryItem,
  GrafxTemplateContent,
} from '~/types/grafx';

// Helper to get environment variables, assuming VITE_ prefix for client-side exposure
const getGrafxEnvVar = (key: string, defaultValue?: string): string => {
  if (typeof import.meta.env === 'object' && import.meta.env !== null && key in import.meta.env) {
    return (import.meta.env as any)[key] ?? defaultValue ?? '';
  }

  return defaultValue ?? '';
};

const initialGrafxStateForReset = {
  // For resetting parts of the store
  availableSubscriptions: undefined,
  selectedSubscriptionGuid: undefined, // Changed from selectedSubscriptionId
  availableEnvironments: undefined,
  selectedEnvironment: null,
  availableTemplates: undefined,
  selectedTemplateId: undefined,
  currentTemplateContent: null,
  isLoading: false,
  error: null,
};

export function useGrafxConnection() {
  const store = useStore(grafxStore);

  const GRAFX_AUTH0_DOMAIN = getGrafxEnvVar('VITE_GRAFX_AUTH0_DOMAIN', 'login.chiligrafx-dev.com');
  const GRAFX_AUTH0_CLIENT_ID = getGrafxEnvVar('VITE_GRAFX_AUTH0_CLIENT_ID', '');
  const GRAFX_AUTH0_REDIRECT_URI = getGrafxEnvVar(
    'VITE_GRAFX_AUTH0_REDIRECT_URI',
    `${window.location.origin}/.auth/login/auth0/callback`,
  );
  const GRAFX_AUTH0_API_AUDIENCE = getGrafxEnvVar('VITE_GRAFX_AUTH0_API_AUDIENCE', ''); // Ensure this is correctly set for Platform & Studio APIs

  const initiateLogin = useCallback(() => {
    grafxStore.setKey('isLoading', true);

    const authorizeUrl = new URL(`https://${GRAFX_AUTH0_DOMAIN}/authorize`);
    authorizeUrl.searchParams.append('response_type', 'code');
    authorizeUrl.searchParams.append('client_id', GRAFX_AUTH0_CLIENT_ID);
    authorizeUrl.searchParams.append('redirect_uri', GRAFX_AUTH0_REDIRECT_URI);
    authorizeUrl.searchParams.append(
      'scope',
      'openid profile email offline_access read:subscriptions read:environments',
    ); // Added example scopes
    authorizeUrl.searchParams.append('audience', GRAFX_AUTH0_API_AUDIENCE);
    window.location.href = authorizeUrl.toString();
  }, [GRAFX_AUTH0_DOMAIN, GRAFX_AUTH0_CLIENT_ID, GRAFX_AUTH0_REDIRECT_URI, GRAFX_AUTH0_API_AUDIENCE]);

  const handleDisconnect = useCallback(() => {
    grafxStore.set({ ...initialGrafxStateForReset, accessToken: undefined, user: undefined }); // Full reset
    /*
     * Optional: Auth0 logout
     * const logoutUrl = `https://${GRAFX_AUTH0_DOMAIN}/v2/logout?client_id=${GRAFX_AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(window.location.origin)}`;
     * window.location.href = logoutUrl;
     */
  }, [GRAFX_AUTH0_DOMAIN, GRAFX_AUTH0_CLIENT_ID]);

  // --- Data Fetching Functions ---
  const fetchSubscriptions = useCallback(
    async () => {
      console.log('[useGrafxConnection] fetchSubscriptions called.');

      const currentAccessToken = grafxStore.get().accessToken;

      if (!currentAccessToken) {
        console.log('[useGrafxConnection] fetchSubscriptions: No access token, returning.');
        return;
      }

      grafxStore.setKey('isLoading', true);
      grafxStore.setKey('error', null);
      console.log('[useGrafxConnection] fetchSubscriptions: isLoading set to true.');

      try {
        console.log('[useGrafxConnection] fetchSubscriptions: Fetching from /api/grafx/platform/subscriptions');

        const response = await fetch('/api/grafx/platform/subscriptions', {
          headers: { Authorization: `Bearer ${currentAccessToken}` },
        });
        console.log('[useGrafxConnection] fetchSubscriptions: Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useGrafxConnection] fetchSubscriptions: Error response text:', errorText);
          throw new Error(`Failed to fetch subscriptions: ${response.statusText} - ${errorText}`);
        }

        let data = (await response.json()) as GrafxBasicSubscriptionModel[];
        console.log('[useGrafxConnection] fetchSubscriptions: Data received:', data);

        const targetGuid = '57718ff6-81c8-4e9e-bbe8-3c4ec86cf184';
        const targetSubscription = data.find((sub) => sub.guid === targetGuid);

        if (targetSubscription) {
          console.log('[useGrafxConnection] fetchSubscriptions: Target subscription found:', targetSubscription);
          data = [targetSubscription];
          grafxStore.setKey('availableSubscriptions', data); // Set filtered list first
          console.log('[useGrafxConnection] fetchSubscriptions: availableSubscriptions (filtered) set in store:', data);
          grafxStore.setKey('selectedSubscriptionGuid', targetSubscription.guid);
          console.log(
            '[useGrafxConnection] fetchSubscriptions: Selected target subscription, now fetching environments for GUID:',
            targetSubscription.guid,
          );
          fetchEnvironments(targetSubscription.guid);
        } else {
          console.log('[useGrafxConnection] fetchSubscriptions: Target subscription NOT found.');
          grafxStore.setKey('availableSubscriptions', data); // Set full list
          console.log('[useGrafxConnection] fetchSubscriptions: availableSubscriptions (full) set in store:', data);
        }
      } catch (err) {
        console.error('[useGrafxConnection] fetchSubscriptions: Error caught:', err);
        grafxStore.setKey('error', err instanceof Error ? err.message : String(err));
      } finally {
        grafxStore.setKey('isLoading', false);
        console.log('[useGrafxConnection] fetchSubscriptions: isLoading set to false.');
      }
    },
    [
      /* fetchEnvironments is stable, no need to list if it's part of the hook itself */
    ],
  );

  const fetchEnvironments = useCallback(
    async (subscriptionGuid: string) => {
      console.log('[useGrafxConnection] fetchEnvironments called with GUID:', subscriptionGuid);

      const currentAccessToken = grafxStore.get().accessToken;

      if (!currentAccessToken || !subscriptionGuid) {
        console.log('[useGrafxConnection] fetchEnvironments: No access token or subscriptionGuid, returning.');
        return;
      }

      grafxStore.setKey('isLoading', true);
      grafxStore.setKey('error', null);
      console.log('[useGrafxConnection] fetchEnvironments: isLoading set to true.');

      try {
        console.log(
          `[useGrafxConnection] fetchEnvironments: Fetching from /api/grafx/platform/environments?subscriptionId=${subscriptionGuid}`,
        );

        const response = await fetch(`/api/grafx/platform/environments?subscriptionId=${subscriptionGuid}`, {
          headers: { Authorization: `Bearer ${currentAccessToken}` },
        });
        console.log('[useGrafxConnection] fetchEnvironments: Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useGrafxConnection] fetchEnvironments: Error response text:', errorText);
          throw new Error(`Failed to fetch environments: ${response.statusText} - ${errorText}`);
        }

        const data = (await response.json()) as GrafxBasicEnvironmentModel[];
        grafxStore.setKey('availableEnvironments', data);
        console.log('[useGrafxConnection] fetchEnvironments: availableEnvironments set:', data);
      } catch (err) {
        console.error('[useGrafxConnection] fetchEnvironments: Error caught:', err);
        grafxStore.setKey('error', err instanceof Error ? err.message : String(err));
      } finally {
        grafxStore.setKey('isLoading', false);
        console.log('[useGrafxConnection] fetchEnvironments: isLoading set to false.');
      }
    },
    [
      /* Empty: uses grafxStore.get() */
    ],
  );

  // New function to fetch templates with search and limit
  const fetchTemplatesBySearch = useCallback(
    async (environment: GrafxBasicEnvironmentModel | null, searchTerm: string = '') => {
      const currentAccessToken = grafxStore.get().accessToken;
      grafxStore.setKey('isLoading', true);
      grafxStore.setKey('error', null);
      grafxStore.setKey('availableTemplates', undefined); // Clear previous templates

      if (!currentAccessToken) {
        grafxStore.setKey('isLoading', false);
        return;
      }

      if (!environment || !environment.technicalName || !environment.backOfficeUri) {
        /*
         * If no environment, or environment is incomplete, don't attempt to fetch.
         * This also handles the case where environment is explicitly set to null.
         */
        grafxStore.setKey('isLoading', false);
        return;
      }

      try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', '50');

        if (searchTerm && searchTerm.trim() !== '') {
          queryParams.append('search', searchTerm.trim());
        }

        const apiUrl = `/api/grafx/studio/environment/templates?${queryParams.toString()}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentAccessToken}`,
          },
          body: JSON.stringify({
            environmentTechnicalName: environment.technicalName,
            environmentBackOfficeUri: environment.backOfficeUri,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch templates: ${response.statusText} - ${errorText}`);
        }

        const data = (await response.json()) as GrafxTemplateSummaryItem[];
        grafxStore.setKey('availableTemplates', data);
      } catch (err) {
        grafxStore.setKey('error', err instanceof Error ? err.message : String(err));
      } finally {
        grafxStore.setKey('isLoading', false);
      }
    },
    [
      /* Empty: uses grafxStore.get() */
    ],
  );

  const fetchTemplateContent = useCallback(
    async (templateId: string, environment: GrafxBasicEnvironmentModel) => {
      const currentAccessToken = grafxStore.get().accessToken;

      if (!currentAccessToken || !templateId || !environment.technicalName || !environment.backOfficeUri) {
        return;
      }

      grafxStore.setKey('isLoading', true);
      grafxStore.setKey('error', null);

      try {
        const response = await fetch('/api/grafx/studio/template/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentAccessToken}`,
          },
          body: JSON.stringify({
            templateId,
            environmentTechnicalName: environment.technicalName,
            environmentBackOfficeUri: environment.backOfficeUri,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch template content: ${response.statusText}`);
        }

        const data = (await response.json()) as GrafxTemplateContent;
        grafxStore.setKey('currentTemplateContent', data);
      } catch (err) {
        grafxStore.setKey('error', err instanceof Error ? err.message : String(err));
      } finally {
        grafxStore.setKey('isLoading', false);
      }
    },
    [
      /* Empty: uses grafxStore.get() */
    ],
  );

  /*
   * --- Selection Handlers ---
   * These handlers now depend on stable fetch functions.
   */
  const selectSubscription = useCallback(
    (subscriptionGuid: string | undefined) => {
      console.log('[useGrafxConnection] selectSubscription called with GUID:', subscriptionGuid);
      grafxStore.setKey('selectedSubscriptionGuid', subscriptionGuid);
      grafxStore.setKey('availableEnvironments', undefined);
      grafxStore.setKey('selectedEnvironment', null);
      grafxStore.setKey('availableTemplates', undefined);
      grafxStore.setKey('selectedTemplateId', undefined);
      grafxStore.setKey('currentTemplateContent', null);

      if (subscriptionGuid) {
        fetchEnvironments(subscriptionGuid);
      }
    },
    [fetchEnvironments],
  ); // fetchEnvironments is now stable

  const selectEnvironment = useCallback(
    (environment: GrafxBasicEnvironmentModel | null) => {
      console.log('[useGrafxConnection] selectEnvironment called with:', environment);
      grafxStore.setKey('selectedEnvironment', environment);
      grafxStore.setKey('availableTemplates', undefined);
      grafxStore.setKey('selectedTemplateId', undefined);
      grafxStore.setKey('currentTemplateContent', null);

      // Call fetchTemplatesBySearch with an empty search term for initial load
      fetchTemplatesBySearch(environment, '');
    },
    [fetchTemplatesBySearch],
  );

  const selectTemplate = useCallback(
    (templateId: string | undefined) => {
      console.log('[useGrafxConnection] selectTemplate called with ID:', templateId);
      grafxStore.setKey('selectedTemplateId', templateId);
      grafxStore.setKey('currentTemplateContent', null);

      const selectedEnv = grafxStore.get().selectedEnvironment;

      if (templateId && selectedEnv) {
        fetchTemplateContent(templateId, selectedEnv);
      }
    },
    [fetchTemplateContent],
  ); // fetchTemplateContent is now stable

  // Effect to manage initial data loading and auto-selection logic
  useEffect(() => {
    const currentStore = grafxStore.get();
    console.log(
      '[useGrafxConnection] useEffect triggered. AccessToken:',
      currentStore.accessToken ? 'present' : 'absent',
      'AvailableSubs:',
      currentStore.availableSubscriptions?.length,
      'SelectedSubGuid:',
      currentStore.selectedSubscriptionGuid,
      'AvailableEnvs:',
      currentStore.availableEnvironments?.length,
    );

    const targetGuid = '57718ff6-81c8-4e9e-bbe8-3c4ec86cf184';

    if (currentStore.accessToken) {
      if (!currentStore.availableSubscriptions) {
        console.log('[useGrafxConnection] useEffect: No available subscriptions in store, calling fetchSubscriptions.');
        fetchSubscriptions();
      } else {
        const targetInLoaded = currentStore.availableSubscriptions.find((sub) => sub.guid === targetGuid);

        if (targetInLoaded && currentStore.selectedSubscriptionGuid !== targetGuid) {
          console.log('[useGrafxConnection] useEffect: Target subscription present but not selected. Auto-selecting.');

          /*
           * This logic is now primarily handled within fetchSubscriptions' success path.
           * If fetchSubscriptions already ran and filtered, this might not be needed here,
           * or could lead to re-filtering if availableSubscriptions was somehow broader.
           * For safety, ensure this doesn't cause a loop if fetchSubscriptions itself updates these dependencies.
           * The current fetchSubscriptions already handles filtering and calling fetchEnvironments.
           * This block might be redundant if fetchSubscriptions always correctly filters and selects.
           * However, if the store was populated from localStorage with a full list, this ensures filtering.
           */
          if (
            currentStore.availableSubscriptions.length > 1 ||
            currentStore.availableSubscriptions[0]?.guid !== targetGuid
          ) {
            grafxStore.setKey('availableSubscriptions', [targetInLoaded]);
          }

          grafxStore.setKey('selectedSubscriptionGuid', targetInLoaded.guid);

          if (!currentStore.availableEnvironments) {
            // Only fetch if not already populated for this selection
            fetchEnvironments(targetInLoaded.guid);
          }
        } else if (
          targetInLoaded &&
          currentStore.selectedSubscriptionGuid === targetGuid &&
          !currentStore.availableEnvironments
        ) {
          console.log(
            '[useGrafxConnection] useEffect: Target subscription selected, but no environments. Fetching environments.',
          );
          fetchEnvironments(targetGuid);
        } else {
          console.log(
            '[useGrafxConnection] useEffect: Conditions NOT met for further auto-selection/fetch, or already processed.',
          );
        }
      }
    } else {
      console.log('[useGrafxConnection] useEffect: No access token.');
    }

    /*
     * Dependencies: React to changes in these specific store values.
     * The fetch functions are stable and don't need to be dependencies here if not called directly in the effect.
     * However, including them if they *are* called is standard practice.
     */
  }, [
    store.accessToken,
    store.availableSubscriptions,
    store.selectedSubscriptionGuid,
    store.availableEnvironments,
    fetchSubscriptions, // Stable
    fetchEnvironments, // Stable
  ]);

  return {
    // Store state (can be accessed directly via useStore(grafxStore) in components too)
    accessToken: store.accessToken,
    user: store.user,
    availableSubscriptions: store.availableSubscriptions,
    selectedSubscriptionGuid: store.selectedSubscriptionGuid, // Changed
    availableEnvironments: store.availableEnvironments,
    selectedEnvironment: store.selectedEnvironment,
    availableTemplates: store.availableTemplates,
    selectedTemplateId: store.selectedTemplateId,
    currentTemplateContent: store.currentTemplateContent,
    isLoading: store.isLoading,
    error: store.error,

    // Actions
    initiateLogin,
    handleDisconnect,
    selectSubscription,
    selectEnvironment,
    selectTemplate,

    /*
     * Raw fetchers if needed by components, though selections should trigger them
     * fetchSubscriptions,
     * fetchEnvironments,
     */
    fetchTemplatesBySearch, // Expose the new function
    // fetchTemplateContent,
  };
}
