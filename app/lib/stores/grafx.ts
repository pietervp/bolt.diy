import { persistentMap } from '@nanostores/persistent';
import type { GrafxState, GrafxUser } from '~/types/grafx';

// Define the initial state for the store
const initialGrafxState: GrafxState = {
  accessToken: undefined,
  user: undefined,

  // inputEnvironmentId and currentEnvironmentDetails removed, selectedEnvironment added
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

/*
 * Create the persistent NanoStore
 * The 'grafx:' prefix is for localStorage keys to avoid collisions
 */
export const grafxStore = persistentMap<GrafxState>('grafx:', initialGrafxState, {
  encode: JSON.stringify, // How to save to localStorage
  decode: JSON.parse, // How to read from localStorage
});

/*
 * Optional: Helper functions to update specific parts of the store can be added later.
 * For example:
 */
export function setGrafxAccessToken(token: string | undefined) {
  grafxStore.setKey('accessToken', token);

  if (token) {
    grafxStore.setKey('error', null);
  } // Clear previous errors if token is set
}

export function setGrafxUser(user: GrafxUser | undefined) {
  grafxStore.setKey('user', user);
}

export function clearGrafxConnection() {
  grafxStore.set(initialGrafxState); // Reset to initial state
}
