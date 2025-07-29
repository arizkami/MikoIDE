#pragma once
#include <string>
#include <vector>
#include <map>
#include <memory>
#include <filesystem>

namespace MikoIDE {
    namespace Sandbox {
        
        struct ExtensionInfo {
            std::string id;
            std::string name;
            std::string version;
            std::string path;
            std::string manifestPath;
            bool isActive;
        };
        
        class ExtensionManager {
        public:
            ExtensionManager();
            ~ExtensionManager();
            
            // Initialize extension manager with extensions directory
            bool Initialize(const std::string& extensionsDir = "extensions");
            
            // Install extension from VSIX file
            bool InstallExtension(const std::string& vsixPath);
            
            // Uninstall extension by ID
            bool UninstallExtension(const std::string& extensionId);
            
            // Load all installed extensions
            bool LoadExtensions();
            
            // Get list of installed extensions
            std::vector<ExtensionInfo> GetInstalledExtensions() const;
            
            // Get extension by ID
            ExtensionInfo* GetExtension(const std::string& extensionId);
            
            // Enable/disable extension
            bool SetExtensionActive(const std::string& extensionId, bool active);
            
            // Get extensions directory path
            std::string GetExtensionsDirectory() const { return extensions_dir_; }
            
        private:
            std::string extensions_dir_;
            std::map<std::string, ExtensionInfo> installed_extensions_;
            bool initialized_;
            
            // Helper methods
            bool ExtractVSIX(const std::string& vsixPath, const std::string& extractPath);
            bool ParseManifest(const std::string& manifestPath, ExtensionInfo& info);
            bool CreateExtensionDirectory(const std::string& extensionId);
            void ScanExtensionsDirectory();
        };
        
    }
}