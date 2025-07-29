#pragma once
#include <string>
#include <vector>
#include <memory>
#include <functional>
#include "include/cef_v8.h"
#include "include/cef_browser.h"
#include "vsix/manager.hpp"

namespace MikoIDE {
    namespace Sandbox {
        
        class ExtensionSandbox {
        public:
            ExtensionSandbox();
            ~ExtensionSandbox();
            
            // Initialize the sandbox environment
            bool Initialize();
            
            // Load and execute extension code
            bool LoadExtension(const std::string& extensionPath);
            
            // Execute JavaScript code in sandbox
            bool ExecuteScript(const std::string& script);
            
            // Register native function for extensions to call
            void RegisterNativeFunction(const std::string& name, 
                                      std::function<void(const std::vector<std::string>&)> callback);
            
            // Extension management methods
            bool InstallExtensionFromVSIX(const std::string& vsixPath);
            bool UninstallExtension(const std::string& extensionId);
            std::vector<ExtensionInfo> GetInstalledExtensions() const;
            bool EnableExtension(const std::string& extensionId);
            bool DisableExtension(const std::string& extensionId);
            
            // Clean up sandbox
            void Cleanup();
            
        private:
            CefRefPtr<CefV8Context> v8_context_;
            CefRefPtr<CefBrowser> browser_;
            bool initialized_;
            
            // Extension manager
            std::unique_ptr<ExtensionManager> extension_manager_;
            
            // Native function registry
            std::map<std::string, std::function<void(const std::vector<std::string>&)>> native_functions_;
            
            // Setup V8 context and global objects
            void SetupV8Context();
            
            // Create sandbox global objects
            void CreateSandboxGlobals();
            
            // Register extension management APIs
            void RegisterExtensionAPIs();
        };
        
        // V8 handler for native function calls
        class NativeFunctionHandler : public CefV8Handler {
        public:
            NativeFunctionHandler(ExtensionSandbox* sandbox);
            
            bool Execute(const CefString& name,
                        CefRefPtr<CefV8Value> object,
                        const CefV8ValueList& arguments,
                        CefRefPtr<CefV8Value>& retval,
                        CefString& exception) override;
                        
        private:
            ExtensionSandbox* sandbox_;
            IMPLEMENT_REFCOUNTING(NativeFunctionHandler);
        };
        
    }
}