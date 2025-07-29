#include "native-function-handler.hpp"
#include "extension-sandbox.hpp"

namespace MikoIDE {
    namespace Sandbox {
        
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
    }
}