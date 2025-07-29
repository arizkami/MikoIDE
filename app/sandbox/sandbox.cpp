#include "sandbox.hpp"
#include "../core/logger.hpp"
#include <fstream>
#include <sstream>

namespace MikoIDE {
    namespace Sandbox {
        
        ExtensionSandbox::ExtensionSandbox() : initialized_(false) {
            extension_manager_ = std::make_unique<ExtensionManager>();
        }
        
        ExtensionSandbox::~ExtensionSandbox() {
            Cleanup();
        }
        
        bool ExtensionSandbox::Initialize() {
            if (initialized_) {
                return true;
            }
            
            try {
                // Initialize extension manager
                if (!extension_manager_->Initialize()) {
                    Logger::LogMessage("Failed to initialize extension manager");
                    return false;
                }
                
                SetupV8Context();
                CreateSandboxGlobals();
                RegisterExtensionAPIs();
                
                initialized_ = true;
                Logger::LogMessage("Extension sandbox initialized successfully");
                return true;
            } catch (const std::exception& e) {
                Logger::LogMessage("Failed to initialize sandbox: " + std::string(e.what()));
                return false;
            }
        }
        
        bool ExtensionSandbox::LoadExtension(const std::string& extensionPath) {
            if (!initialized_) {
                Logger::LogMessage("Sandbox not initialized");
                return false;
            }
            
            std::ifstream file(extensionPath);
            if (!file.is_open()) {
                Logger::LogMessage("Failed to open extension file: " + extensionPath);
                return false;
            }
            
            std::stringstream buffer;
            buffer << file.rdbuf();
            std::string script = buffer.str();
            
            return ExecuteScript(script);
        }
        
        bool ExtensionSandbox::ExecuteScript(const std::string& script) {
            if (!initialized_ || !v8_context_) {
                return false;
            }
            
            CefRefPtr<CefV8Value> retval;
            CefRefPtr<CefV8Exception> exception;
            
            bool success = v8_context_->Eval(script, CefString(), 0, retval, exception);
            
            if (!success && exception) {
                Logger::LogMessage("Script execution failed: " + exception->GetMessage().ToString());
                return false;
            }
            
            return success;
        }
        
        void ExtensionSandbox::RegisterNativeFunction(const std::string& name, 
                                                     std::function<void(const std::vector<std::string>&)> callback) {
            native_functions_[name] = callback;
            
            if (v8_context_) {
                CefRefPtr<CefV8Value> global = v8_context_->GetGlobal();
                CefRefPtr<NativeFunctionHandler> handler = new NativeFunctionHandler(this);
                CefRefPtr<CefV8Value> func = CefV8Value::CreateFunction(name, handler);
                global->SetValue(name, func, V8_PROPERTY_ATTRIBUTE_NONE);
            }
        }
        
        void ExtensionSandbox::Cleanup() {
            if (v8_context_) {
                v8_context_ = nullptr;
            }
            native_functions_.clear();
            initialized_ = false;
        }
        
        void ExtensionSandbox::SetupV8Context() {
            // This would typically be called from a CEF render process
            // For now, we'll set up a basic context
            if (CefV8Context::InContext()) {
                v8_context_ = CefV8Context::GetCurrentContext();
            }
        }
        
        void ExtensionSandbox::CreateSandboxGlobals() {
            if (!v8_context_) {
                return;
            }
            
            CefRefPtr<CefV8Value> global = v8_context_->GetGlobal();
            
            // Create console object
            CefRefPtr<CefV8Value> console = CefV8Value::CreateObject(nullptr, nullptr);
            
            // Add console.log function
            CefRefPtr<NativeFunctionHandler> handler = new NativeFunctionHandler(this);
            CefRefPtr<CefV8Value> logFunc = CefV8Value::CreateFunction("log", handler);
            console->SetValue("log", logFunc, V8_PROPERTY_ATTRIBUTE_NONE);
            
            global->SetValue("console", console, V8_PROPERTY_ATTRIBUTE_NONE);
            
            // Register console.log as a native function
            RegisterNativeFunction("log", [](const std::vector<std::string>& args) {
                std::string message = "Console: ";
                for (const auto& arg : args) {
                    message += arg + " ";
                }
                Logger::LogMessage(message);
            });
        }
        
        // NativeFunctionHandler implementation
        NativeFunctionHandler::NativeFunctionHandler(ExtensionSandbox* sandbox) 
            : sandbox_(sandbox) {
        }
        
        bool NativeFunctionHandler::Execute(const CefString& name,
                                           CefRefPtr<CefV8Value> object,
                                           const CefV8ValueList& arguments,
                                           CefRefPtr<CefV8Value>& retval,
                                           CefString& exception) {
            
            std::string funcName = name.ToString();
            auto it = sandbox_->GetNativeFunctions().find(funcName);
            
            if (it != sandbox_->GetNativeFunctions().end()) {
                std::vector<std::string> args;
                for (const auto& arg : arguments) {
                    if (arg->IsString()) {
                        args.push_back(arg->GetStringValue().ToString());
                    }
                }
                
                try {
                    it->second(args);
                    retval = CefV8Value::CreateUndefined();
                    return true;
                } catch (const std::exception& e) {
                    exception = CefString(e.what());
                    return false;
                }
            }
            
            return false;
        }
        
        bool ExtensionSandbox::InstallExtensionFromVSIX(const std::string& vsixPath) {
            if (!initialized_ || !extension_manager_) {
                return false;
            }
            return extension_manager_->InstallExtension(vsixPath);
        }
        
        bool ExtensionSandbox::UninstallExtension(const std::string& extensionId) {
            if (!initialized_ || !extension_manager_) {
                return false;
            }
            return extension_manager_->UninstallExtension(extensionId);
        }
        
        std::vector<ExtensionInfo> ExtensionSandbox::GetInstalledExtensions() const {
            if (!extension_manager_) {
                return {};
            }
            return extension_manager_->GetInstalledExtensions();
        }
        
        bool ExtensionSandbox::EnableExtension(const std::string& extensionId) {
            if (!extension_manager_) {
                return false;
            }
            return extension_manager_->SetExtensionActive(extensionId, true);
        }
        
        bool ExtensionSandbox::DisableExtension(const std::string& extensionId) {
            if (!extension_manager_) {
                return false;
            }
            return extension_manager_->SetExtensionActive(extensionId, false);
        }
        
        void ExtensionSandbox::RegisterExtensionAPIs() {
            // Register extension management functions for JavaScript
            RegisterNativeFunction("installExtension", [this](const std::vector<std::string>& args) {
                if (!args.empty()) {
                    bool success = InstallExtensionFromVSIX(args[0]);
                    Logger::LogMessage(std::string("Extension installation ") + (success ? "succeeded" : "failed"));
                }
            });
            
            RegisterNativeFunction("uninstallExtension", [this](const std::vector<std::string>& args) {
                if (!args.empty()) {
                    bool success = UninstallExtension(args[0]);
                    Logger::LogMessage(std::string("Extension uninstallation ") + (success ? "succeeded" : "failed"));
                }
            });
            
            RegisterNativeFunction("listExtensions", [this](const std::vector<std::string>& args) {
                auto extensions = GetInstalledExtensions();
                Logger::LogMessage(std::string("Found ") + std::to_string(extensions.size()) + std::string(" installed extensions"));
                for (const auto& ext : extensions) {
                    Logger::LogMessage("- " + ext.name + " (" + ext.id + ") - " + (ext.isActive ? "Active" : "Inactive"));
                }
            });
        }
        
    }
}