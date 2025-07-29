#pragma once
#include <string>
#include <vector>
#include <memory>
#include <functional>
#include "include/cef_v8.h"
#include "include/cef_browser.h"
#include "vsix/manager.hpp"
#include "extension-sandbox.hpp"
#include "native-function-handler.hpp"
#include "v8-context-manager.hpp"

// Main sandbox namespace
namespace MikoIDE {
    namespace Sandbox {
        // Re-export main classes for backward compatibility
        using ExtensionSandbox = ExtensionSandbox;
        using NativeFunctionHandler = NativeFunctionHandler;
        using V8ContextManager = V8ContextManager;
    }
}