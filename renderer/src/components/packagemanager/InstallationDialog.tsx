import React, { useState } from 'react';
import { X, Folder, HardDrive, AlertTriangle, Info } from 'lucide-react';
import type { Toolchain } from './PackageManager';

interface InstallationDialogProps {
  toolchain: Toolchain | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall: (toolchain: Toolchain, installationType: 'sandbox' | 'local', customPath?: string) => void;
}

type InstallationType = 'sandbox' | 'local';

const InstallationDialog: React.FC<InstallationDialogProps> = ({
  toolchain,
  isOpen,
  onClose,
  onInstall
}) => {
  const [selectedInstallationType, setSelectedInstallationType] = useState<InstallationType>('sandbox');
  const [customPath, setCustomPath] = useState('');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  if (!isOpen || !toolchain) return null;

  // Detect platform (in a real app, this would come from the backend)
  const isWindows = navigator.platform.toLowerCase().includes('win');
  const isLinux = navigator.platform.toLowerCase().includes('linux');

  const handleInstall = () => {
    onInstall(toolchain, selectedInstallationType, customPath || undefined);
    onClose();
  };

  const getSandboxPath = () => {
    return `{app}/sandbox/tools/${toolchain.name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const getDefaultLocalPath = () => {
    if (isWindows) {
      return `C:\\Tools\\${toolchain.name.replace(/\s+/g, '')}`;
    }
    return `/usr/local/bin/${toolchain.name.toLowerCase().replace(/\s+/g, '-')}`;
  };

  return (
    <div className="fixed inset-0 bg-[#0d111788] backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2d2d30] border border-[#3e3e42] rounded-lg w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3e3e42]">
          <h2 className="text-[#cccccc] font-semibold text-sm">
            Install {toolchain.name}
          </h2>
          <button
            onClick={onClose}
            className="text-[#858585] hover:text-[#cccccc] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Toolchain Info */}
          <div className="bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
            <div className="text-[#cccccc] text-sm font-medium mb-1">
              {toolchain.name} v{toolchain.version}
            </div>
            <div className="text-[#858585] text-xs mb-2">
              {toolchain.description}
            </div>
            <div className="text-[#858585] text-xs">
              Size: {toolchain.size < 1 ? 
                `${(toolchain.size * 1024).toFixed(0)} KB` : 
                `${toolchain.size.toFixed(1)} MB`
              }
            </div>
          </div>

          {/* Installation Type Selection */}
          <div className="space-y-3">
            <div className="text-[#cccccc] text-sm font-medium">
              Installation Location
            </div>

            {/* Windows Options */}
            {isWindows && (
              <>
                {/* Sandbox Option */}
                <label className="flex items-start space-x-3 p-3 bg-[#1e1e1e] rounded border border-[#3e3e42] cursor-pointer hover:bg-[#252526] transition-colors">
                  <input
                    type="radio"
                    name="installationType"
                    value="sandbox"
                    checked={selectedInstallationType === 'sandbox'}
                    onChange={(e) => setSelectedInstallationType(e.target.value as InstallationType)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Folder size={14} className="text-[#0078d4]" />
                      <span className="text-[#cccccc] text-sm font-medium">
                        Sandbox Folder (Recommended)
                      </span>
                    </div>
                    <div className="text-[#858585] text-xs mb-2">
                      Install within the IDE's sandbox environment for better security and isolation.
                    </div>
                    <div className="text-[#0078d4] text-xs font-mono">
                      {getSandboxPath()}
                    </div>
                  </div>
                </label>

                {/* Local Option with Warning */}
                <label className="flex items-start space-x-3 p-3 bg-[#1e1e1e] rounded border border-[#3e3e42] cursor-pointer hover:bg-[#252526] transition-colors">
                  <input
                    type="radio"
                    name="installationType"
                    value="local"
                    checked={selectedInstallationType === 'local'}
                    onChange={(e) => setSelectedInstallationType(e.target.value as InstallationType)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <HardDrive size={14} className="text-[#f9c23c]" />
                      <span className="text-[#cccccc] text-sm font-medium">
                        Local Installation
                      </span>
                      <div className="flex items-center space-x-1 text-[#f9c23c]">
                        <AlertTriangle size={12} />
                        <span className="text-xs">Not Recommended</span>
                      </div>
                    </div>
                    <div className="text-[#858585] text-xs mb-2">
                      Install directly to the system. May require administrator privileges and can affect system stability.
                    </div>
                    <div className="text-[#f9c23c] text-xs font-mono">
                      {customPath || getDefaultLocalPath()}
                    </div>
                  </div>
                </label>
              </>
            )}

            {/* Linux Options */}
            {isLinux && (
              <label className="flex items-start space-x-3 p-3 bg-[#1e1e1e] rounded border border-[#3e3e42] cursor-pointer hover:bg-[#252526] transition-colors">
                <input
                  type="radio"
                  name="installationType"
                  value="local"
                  checked={selectedInstallationType === 'local'}
                  onChange={(e) => setSelectedInstallationType(e.target.value as InstallationType)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <HardDrive size={14} className="text-[#73c991]" />
                    <span className="text-[#cccccc] text-sm font-medium">
                      Local Installation
                    </span>
                  </div>
                  <div className="text-[#858585] text-xs mb-2">
                    Install to the local system using package manager or manual installation.
                  </div>
                  <div className="text-[#73c991] text-xs font-mono">
                    {customPath || getDefaultLocalPath()}
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Advanced Options */}
          <div className="space-y-2">
            <button
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              className="flex items-center space-x-2 text-[#0078d4] text-xs hover:text-[#1a8cff] transition-colors"
            >
              <Info size={12} />
              <span>{isAdvancedMode ? 'Hide' : 'Show'} Advanced Options</span>
            </button>

            {isAdvancedMode && (
              <div className="space-y-2">
                <label className="block text-[#cccccc] text-xs">
                  Custom Installation Path:
                </label>
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder={selectedInstallationType === 'sandbox' ? getSandboxPath() : getDefaultLocalPath()}
                  className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-[#cccccc] placeholder-[#858585]"
                />
                <div className="text-[#858585] text-xs">
                  Leave empty to use the default path for the selected installation type.
                </div>
              </div>
            )}
          </div>

          {/* Installation Command Preview */}
          {toolchain.installCommand && (
            <div className="bg-[#1e1e1e] p-3 rounded border border-[#3e3e42]">
              <div className="text-[#cccccc] text-xs font-medium mb-2">
                Installation Command:
              </div>
              <code className="text-[#73c991] text-xs font-mono break-all">
                {toolchain.installCommand}
              </code>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t border-[#3e3e42]">
          <button
            onClick={onClose}
            className="px-3 py-1 text-[#cccccc] text-xs hover:bg-[#3c3c3c] rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-1 bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs rounded transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallationDialog;