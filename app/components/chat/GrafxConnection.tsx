import { useState } from 'react';
import { useGrafxConnection } from '~/lib/hooks/useGrafxConnection';
import { classNames } from '~/utils/classNames';
import { Dialog, DialogRoot, DialogClose, DialogTitle, DialogButton } from '~/components/ui/Dialog'; // Assuming Dialog components are similar to Supabase

// A generic GraFx icon (placeholder - replace with actual SVG or image URL if available)
const GrafxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
  </svg>
);

export function GrafxConnection() {
  const {
    accessToken, // Use accessToken to determine connection status
    user, // Use user directly
    isLoading, // Use isLoading for connecting state
    initiateLogin,
    handleDisconnect,

    /*
     * setSelectedApiBaseUrl, // Will use later
     * setEnvironmentId, // Will use later
     */
  } = useGrafxConnection();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isActuallyConnected = !!accessToken; // Derived state

  /*
   * Placeholder for environment ID input if needed later
   * const [inputEnvironmentId, setInputEnvironmentId] = useState('');
   */

  const handleConnectClick = () => {
    /*
     * For Auth0, login is initiated, then dialog might be closed or show loading.
     * The dialog here is more for post-connection management or if direct token input was an option.
     * For now, the button outside the dialog will trigger login.
     * If already connected, this button opens the dialog for management.
     */
    if (!isActuallyConnected) {
      initiateLogin();
    } else {
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleConnectClick}
        disabled={isLoading} // Use isLoading
        title={isActuallyConnected ? `GraFx: ${user?.email || 'Connected'}` : 'Connect to GraFx Studio'}
        className={classNames(
          'flex items-center p-1.5 mr-2 border rounded-md text-sm hover:bg-bolt-elements-item-backgroundActive',
          isActuallyConnected
            ? 'border-blue-500 text-blue-500'
            : 'border-bolt-elements-borderColor text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        <GrafxIcon />
        {isActuallyConnected && user?.name && (
          <span className="ml-1 text-xs max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
        )}
        {isLoading && <span className="ml-1 text-xs">Connecting...</span>}
      </button>

      <DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {isDialogOpen && (
          <Dialog className="max-w-[520px] p-6">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="flex items-center gap-2">
                <GrafxIcon />
                GraFx Studio Connection
              </DialogTitle>
              <DialogClose />
            </div>

            {isActuallyConnected ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm text-green-700 dark:text-green-300">
                  Successfully connected to GraFx Studio.
                </div>
                {user && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-bolt-elements-textPrimary">User: {user.name || 'N/A'}</h4>
                    <p className="text-xs text-bolt-elements-textSecondary">Email: {user.email || 'N/A'}</p>
                    <p className="text-xs text-bolt-elements-textSecondary">ID: {user.id || 'N/A'}</p>
                  </div>
                )}

                {/* Placeholder for Environment ID input and API base selection */}
                {/* 
                <div>
                  <label className="block text-sm text-bolt-elements-textSecondary mb-1">GraFx Environment ID:</label>
                  <input 
                    type="text" 
                    placeholder="Enter Environment ID" 
                    // value={inputEnvironmentId} 
                    // onChange={(e) => setInputEnvironmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8F8F8] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#333333]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-bolt-elements-textSecondary mb-1">API Target:</label>
                  <select 
                    // value={connection.selectedApiBaseUrl} 
                    // onChange={(e) => setSelectedApiBaseUrl(e.target.value as 'STG' | 'PRD')}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#F8F8F8] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#333333]"
                  >
                    <option value="STG">STG (api.chiligrafx-stg.com)</option>
                    <option value="PRD">PRD (api.chiligrafx.com)</option>
                  </select>
                </div>
                <DialogButton 
                  // onClick={() => setEnvironmentId(inputEnvironmentId)} 
                  // disabled={!inputEnvironmentId}
                >
                  Load Environment
                </DialogButton>
                */}

                <div className="flex justify-end gap-2 mt-6">
                  <DialogButton type="secondary" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </DialogButton>
                  <DialogButton
                    type="danger"
                    onClick={() => {
                      handleDisconnect();
                      setIsDialogOpen(false);
                    }}
                  >
                    <div className="i-ph:plugs w-4 h-4" /> {/* Assuming UnoCSS icon */}
                    Disconnect
                  </DialogButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-bolt-elements-textSecondary">
                  You are not connected to GraFx Studio. Click the button outside this dialog to connect.
                </p>
                <div className="flex justify-end gap-2 mt-6">
                  <DialogButton type="secondary" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </DialogButton>
                </div>
              </div>
            )}
          </Dialog>
        )}
      </DialogRoot>
    </div>
  );
}
