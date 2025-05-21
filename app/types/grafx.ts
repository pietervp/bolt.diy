export interface GrafxUser {
  id?: string;
  email?: string;
  name?: string;

  // Add any other user details provided by Auth0/GraFx
}

export interface GrafxAuthTokenResponse {
  access_token: string;
  id_token?: string; // Typically included if 'openid' scope was requested
  scope?: string;
  expires_in?: number;
  token_type: string; // Usually "Bearer"
  refresh_token?: string; // If offline_access scope was requested
}

// Platform API Types
export interface GrafxBasicSubscriptionModel {
  id: number; // Platform's internal ID for the subscription
  guid: string; // UUID string
  name: string;
  isActive: boolean;

  /*
   * Add other relevant fields from BasicSubscriptionModel swagger if needed
   * e.g., clientId, clientName, isGraFxPricebook, subscriptionType, pricebookVersion
   */
}

export interface GrafxBasicEnvironmentModel {
  // From Platform API /api/v1/environments
  id: number; // Platform's internal ID for the environment
  guid: string; // The UUID, to be used as 'environmentId' for Studio template API calls
  name?: string | null;
  type?: 'development' | 'sandbox' | 'production'; // EnvironmentType from swagger
  backOfficeUri?: string | null; // Used to derive hostname for Studio template API
  technicalName?: string | null; // Used as 'environmentDefaultName' for Studio template API
  /*
   * Add other relevant fields from BasicEnvironmentModel swagger if needed
   * e.g., region, usedStorage
   */
}

// Studio API Types (for templates)
export interface GrafxTemplateSummaryItem {
  // Item from the Studio templates "data" array
  id: string;
  name: string;
  type?: number; // As seen in the example response
  // any other relevant summary fields from the API response
}

export interface GrafxListTemplatesResponse {
  // Matches the Studio API response structure for listing templates
  data: GrafxTemplateSummaryItem[];
  pageSize?: number;
  links?: { nextPage?: string };
  total?: number;
}

export interface GrafxTemplateContent {
  // Represents the full template data (metadata + JSON) from Studio API
  id: string;
  name: string; // From metadata call
  json: any; // The actual template JSON from the /download endpoint
  // Add any other detailed properties
}

// Constants
export const GRAFX_PLATFORM_API_BASE_URL = 'https://api.chiligrafx-dev.com';

/*
 * GRAFX_DEV_API_BASE_URL for Studio is not a primary constant anymore,
 * as Studio API calls will be constructed using backOfficeUri from GrafxBasicEnvironmentModel.
 */

export interface GrafxState {
  accessToken?: string;
  user?: GrafxUser;

  // Platform API related state
  availableSubscriptions?: GrafxBasicSubscriptionModel[];
  selectedSubscriptionGuid?: string | undefined; // Changed from selectedSubscriptionId (number) to GUID (string)

  availableEnvironments?: GrafxBasicEnvironmentModel[]; // Environments under selected subscription
  selectedEnvironment?: GrafxBasicEnvironmentModel | null; // Store the whole selected GrafxBasicEnvironmentModel object

  /*
   * Template related state (Studio API)
   * inputEnvironmentId and currentEnvironmentDetails are effectively replaced by selectedEnvironment
   */
  availableTemplates?: GrafxTemplateSummaryItem[]; // Populated from Studio API
  selectedTemplateId?: string; // ID of the template selected from availableTemplates
  currentTemplateContent?: GrafxTemplateContent | null; // Fetched for selectedTemplateId from Studio API

  isLoading: boolean;
  error?: string | null;
}
