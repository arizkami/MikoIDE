#include "extension-sandbox.hpp"
#include "../core/logger.hpp"
#include "../utils/terminal.hpp"
#include <fstream>
#include <sstream>

namespace MikoIDE {
    namespace Sandbox {
        
        ExtensionSandbox::ExtensionSandbox() : initialized_(false) {
            extension_manager_ = std::make_unique<ExtensionManager>();
            v8_manager_ = std::make_unique<V8ContextManager>();
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
                
                // Initialize V8 context manager
                if (!v8_manager_->Initialize()) {
                    Logger::LogMessage("Failed to initialize V8 context manager");
                    return false;
                }
                
                v8_manager_->CreateSandboxGlobals();
                RegisterExtensionAPIs();
                RegisterTerminalAPIs();
                
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
            if (!initialized_ || !v8_manager_) {
                return false;
            }
            
            return v8_manager_->ExecuteScript(script);
        }
        
        void ExtensionSandbox::RegisterNativeFunction(const std::string& name, 
                                                     std::function<void(const std::vector<std::string>&)> callback) {
            native_functions_[name] = callback;
            
            if (v8_manager_ && v8_manager_->IsInitialized()) {
                CefRefPtr<NativeFunctionHandler> handler = new NativeFunctionHandler(this);
                v8_manager_->RegisterFunction(name, handler);
            }
        }
        
        void ExtensionSandbox::Cleanup() {
            if (v8_manager_) {
                v8_manager_->Cleanup();
            }
            native_functions_.clear();
            initialized_ = false;
        }
        
        // Extension management methods
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
        
        void ExtensionSandbox::RegisterTerminalAPIs() {
            // Terminal management functions
            RegisterNativeFunction("createTerminal", [this](const std::vector<std::string>& args) {
                std::string command = args.size() > 0 ? args[0] : "";
                std::string workingDir = args.size() > 1 ? args[1] : "";
                
                std::string terminalId = Utils::Terminal::GetInstance().CreateTerminal(command, workingDir);
                Logger::LogMessage("Created terminal: " + terminalId);
            });
            
            RegisterNativeFunction("sendTerminalInput", [this](const std::vector<std::string>& args) {
                if (args.size() >= 2) {
                    bool success = Utils::Terminal::GetInstance().SendInput(args[0], args[1]);
                    Logger::LogMessage(std::string("Terminal input sent: ") + (success ? "success" : "failed"));
                }
            });
            
            RegisterNativeFunction("sendTerminalCommand", [this](const std::vector<std::string>& args) {
                if (args.size() >= 2) {
                    bool success = Utils::Terminal::GetInstance().SendCommand(args[0], args[1]);
                    Logger::LogMessage(std::string("Terminal command sent: ") + (success ? "success" : "failed"));
                }
            });
            
            RegisterNativeFunction("closeTerminal", [this](const std::vector<std::string>& args) {
                if (!args.empty()) {
                    bool success = Utils::Terminal::GetInstance().CloseTerminal(args[0]);
                    Logger::LogMessage(std::string("Terminal closed: ") + (success ? "success" : "failed"));
                }
            });
            
            RegisterNativeFunction("resizeTerminal", [this](const std::vector<std::string>& args) {
                if (args.size() >= 3) {
                    std::string terminalId = args[0];
                    int cols = std::stoi(args[1]);
                    int rows = std::stoi(args[2]);
                    bool success = Utils::Terminal::GetInstance().ResizeTerminal(terminalId, cols, rows);
                    Logger::LogMessage(std::string("Terminal resized: ") + (success ? "success" : "failed"));
                }
            });
            
            // Set up terminal output callback to send to frontend
            Utils::Terminal::GetInstance().SetGlobalOutputCallback(
                [this](const std::string& terminalId, const Utils::TerminalMessage& msg) {
                    // Forward terminal output to frontend via CEF
                    if (v8_manager_ && v8_manager_->IsInitialized()) {
                        // Create JavaScript event for terminal output
                        std::string script = "if (window.onTerminalOutput) { window.onTerminalOutput('" + 
                            terminalId + "', '" + 
                            (msg.type == Utils::TerminalMessage::OUTPUT ? "output" : 
                             (msg.type == Utils::TerminalMessage::ERROR ? "error" : "exit")) + "', '" +
                            msg.data + "', " + std::to_string(msg.exitCode) + "); }";
                        v8_manager_->ExecuteScript(script);
                    }
                }
            );
        }
    }
}