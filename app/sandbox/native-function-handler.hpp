#pragma once
#include "include/cef_v8.h"
#include <functional>
#include <vector>
#include <string>

namespace MikoIDE {
    namespace Sandbox {
        
        class ExtensionSandbox; // Forward declaration
        
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