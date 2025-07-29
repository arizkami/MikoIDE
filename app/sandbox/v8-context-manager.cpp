#include "v8-context-manager.hpp"
#include "../core/logger.hpp"
#include "native-function-handler.hpp"

namespace MikoIDE {
    namespace Sandbox {
        
        V8ContextManager::V8ContextManager() {
        }
        
        V8ContextManager::~V8ContextManager() {
            Cleanup();
        }
        
        bool V8ContextManager::Initialize() {
            try {
                SetupV8Context();
                return v8_context_ != nullptr;
            } catch (const std::exception& e) {
                Logger::LogMessage("Failed to initialize V8 context: " + std::string(e.what()));
                return false;
            }
        }
        
        void V8ContextManager::Cleanup() {
            if (v8_context_) {
                v8_context_ = nullptr;
            }
        }
        
        bool V8ContextManager::ExecuteScript(const std::string& script) {
            if (!v8_context_) {
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
        
        void V8ContextManager::SetupV8Context() {
            // This would typically be called from a CEF render process
            // For now, we'll set up a basic context
            if (CefV8Context::InContext()) {
                v8_context_ = CefV8Context::GetCurrentContext();
            }
        }
        
        void V8ContextManager::CreateSandboxGlobals() {
            if (!v8_context_) {
                return;
            }
            
            CefRefPtr<CefV8Value> global = v8_context_->GetGlobal();
            
            // Create console object
            CefRefPtr<CefV8Value> console = CefV8Value::CreateObject(nullptr, nullptr);
            global->SetValue("console", console, V8_PROPERTY_ATTRIBUTE_NONE);
        }
        
        void V8ContextManager::RegisterFunction(const std::string& name, CefRefPtr<CefV8Handler> handler) {
            if (!v8_context_) {
                return;
            }
            
            CefRefPtr<CefV8Value> global = v8_context_->GetGlobal();
            CefRefPtr<CefV8Value> func = CefV8Value::CreateFunction(name, handler);
            global->SetValue(name, func, V8_PROPERTY_ATTRIBUTE_NONE);
        }
    }
}