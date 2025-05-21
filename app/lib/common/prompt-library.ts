import { getSystemPrompt } from './prompts/prompts';
import optimized from './prompts/optimized';
import { getFineTunedPrompt } from './prompts/new-prompt';

export interface PromptOptions {
  cwd: string;
  allowedHtmlElements: string[];
  modificationTagName: string;
  supabase?: {
    isConnected: boolean;
    hasSelectedProject: boolean;
    credentials?: {
      anonKey?: string;
      supabaseUrl?: string;
    };
  };
  grafx?: {
    isConnected: boolean;
    hasSelectedEnvironment: boolean; // True if environmentId and apiBaseUrl are set
    accessToken?: string; // To store the GraFx access token
    environmentId?: string; // To store the selected GraFx environment ID
    apiBaseUrl?: string; // To store the API base URL for the selected environment (e.g., STG/PRD)
    templateId?: string; // To store the ID of a selected template
    templateJson?: any; // To store the actual JSON content of the selected template. We can refine 'any' to a more specific type if the template structure is known.
  };
}

export class PromptLibrary {
  static library: Record<
    string,
    {
      label: string;
      description: string;
      get: (options: PromptOptions) => string;
    }
  > = {
    default: {
      label: 'Default Prompt',
      description: 'This is the battle tested default system Prompt',
      get: (options) => getSystemPrompt(options.cwd, options.supabase),
    },
    enhanced: {
      label: 'Fine Tuned Prompt',
      description: 'An fine tuned prompt for better results',
      get: (options) => getFineTunedPrompt(options.cwd, options.supabase),
    },
    optimized: {
      label: 'Optimized Prompt (experimental)',
      description: 'an Experimental version of the prompt for lower token usage',
      get: (options) => optimized(options),
    },
    studioUiIntegration: {
      label: 'Studio UI Integration',
      description: 'System prompt tailored for Studio UI integration tasks.',
      get: (options) =>
        `${JSON.stringify(options)} You are a knowledgeable assistant who guides the user step-by-step through integrating the Studio UI technique into their project. Provide code examples, best practices, and troubleshooting tips.`,
    },
    studioSdkIntegration: {
      label: 'Studio SDK Integration',
      description: 'System prompt tailored for Studio SDK integration tasks.',
      get: (options) =>
        `${JSON.stringify(options)} You are an expert assistant for guiding the user through integrating the Studio SDK into their project. Provide detailed instructions, code examples, and troubleshooting advice for using the SDK.`,
    },
    realTimeRenderingIntegration: {
      label: 'Real Time Rendering Integration',
      description: 'System prompt tailored for Real Time Rendering integration tasks.',
      get: (options) =>
        `${JSON.stringify(options)} You are a specialist in real-time rendering integration. Explain architecture, setup, and best practices for real-time rendering pipelines, performance optimization, and debugging.`,
    },
  };
  static getList() {
    return Object.entries(this.library).map(([key, value]) => {
      const { label, description } = value;
      return {
        id: key,
        label,
        description,
      };
    });
  }
  static getPropmtFromLibrary(promptId: string, options: PromptOptions) {
    const prompt = this.library[promptId];

    if (!prompt) {
      throw 'Prompt Now Found';
    }

    return this.library[promptId]?.get(options);
  }
}
