#pragma once
#include "include/cef_v8.h"
#include "include/cef_browser.h"
#include <functional>
#include <map>

namespace MikoIDE {
    namespace Sandbox {
        
        class V8ContextManager {
        public:
            V8ContextManager();
            ~V8ContextManager();
            
            bool Initialize();
            void Cleanup();
            
            bool ExecuteScript(const std::string& script);
            void CreateSandboxGlobals();
            void RegisterFunction(const std::string& name, CefRefPtr<CefV8Handler> handler);
            
            CefRefPtr<CefV8Context> GetContext() const { return v8_context_; }
            bool IsInitialized() const { return v8_context_ != nullptr; }
            
        private:
            CefRefPtr<CefV8Context> v8_context_;
            CefRefPtr<CefBrowser> browser_;
            
            void SetupV8Context();
        };
    }
}