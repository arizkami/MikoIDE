#pragma once
#include <string>
#include <vector>
#include <memory>
#include <functional>
#include "include/cef_v8.h"
#include "include/cef_browser.h"
#include "vsix/manager.hpp"
#include "v8-context-manager.hpp"
#include "native-function-handler.hpp"

namespace MikoIDE {
    namespace Sandbox {
        
        class ExtensionSandbox {
        public:
            ExtensionSandbox();
            ~ExtensionSandbox();
            
            // Core functionality
            bool Initialize();
            bool LoadExtension(const std::string& extensionPath);
            bool ExecuteScript(const std::string& script);
            void Cleanup();
            
            // Extension management
            bool InstallExtensionFromVSIX(const std::string& vsixPath);
            bool UninstallExtension(const std::string& extensionId);
            std::vector<ExtensionInfo> GetInstalledExtensions() const;
            bool EnableExtension(const std::string& extensionId);
            bool DisableExtension(const std::string& extensionId);
            
            // Native function registration
            void RegisterNativeFunction(const std::string& name, 
                                      std::function<void(const std::vector<std::string>&)> callback);
            
            // Getters for internal access
            const std::map<std::string, std::function<void(const std::vector<std::string>&)>>& GetNativeFunctions() const {
                return native_functions_;
            }
            
        private:
            bool initialized_;
            std::unique_ptr<ExtensionManager> extension_manager_;
            std::unique_ptr<V8ContextManager> v8_manager_;
            std::map<std::string, std::function<void(const std::vector<std::string>&)>> native_functions_;
            
            void RegisterExtensionAPIs();
            void RegisterTerminalAPIs();
        };
    }
}