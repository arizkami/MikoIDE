#include "client.hpp"
#include "config.hpp"
#include "logger.hpp"
#include "include/wrapper/cef_helpers.h"
#include <SDL.h>

// Global variables (declared in main.cpp)
extern SDL_Window* g_sdl_window;

// CloseBrowserTask implementation
CloseBrowserTask::CloseBrowserTask(CefRefPtr<SimpleClient> client, bool force_close)
    : client_(client), force_close_(force_close) {
}

void CloseBrowserTask::Execute() {
    client_->DoCloseAllBrowsers(force_close_);
}

// SimpleClient implementation
SimpleClient::SimpleClient() {
}

CefRefPtr<CefDisplayHandler> SimpleClient::GetDisplayHandler() {
    return this;
}

CefRefPtr<CefLifeSpanHandler> SimpleClient::GetLifeSpanHandler() {
    return this;
}

CefRefPtr<CefLoadHandler> SimpleClient::GetLoadHandler() {
    return this;
}

void SimpleClient::OnTitleChange(CefRefPtr<CefBrowser> browser,
                                const CefString& title) {
    CEF_REQUIRE_UI_THREAD();
    
    std::string windowTitle = "SwipeIDE - " + title.ToString();
    if (AppConfig::IsDebugMode()) {
        windowTitle += " [DEBUG]";
    } else {
        windowTitle += " [RELEASE]";
    }
    
    if (g_sdl_window) {
        SDL_SetWindowTitle(g_sdl_window, windowTitle.c_str());
    }
}

void SimpleClient::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
    CEF_REQUIRE_UI_THREAD();
    browser_list_.push_back(browser);
    
    std::string mode = AppConfig::IsDebugMode() ? "DEBUG" : "RELEASE";
    std::string url = AppConfig::GetStartupUrl();
    Logger::LogMessage("CEF Browser started in " + mode + " mode");
    Logger::LogMessage("Loading URL: " + url);
}

bool SimpleClient::DoClose(CefRefPtr<CefBrowser> browser) {
    CEF_REQUIRE_UI_THREAD();
    return false;
}

void SimpleClient::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
    CEF_REQUIRE_UI_THREAD();
    
    BrowserList::iterator bit = browser_list_.begin();
    for (; bit != browser_list_.end(); ++bit) {
        if ((*bit)->IsSame(browser)) {
            browser_list_.erase(bit);
            break;
        }
    }

    if (browser_list_.empty()) {
        extern bool g_running;
        g_running = false;
        // Remove this line: CefQuitMessageLoop();
    }
}

void SimpleClient::OnLoadError(CefRefPtr<CefBrowser> browser,
                              CefRefPtr<CefFrame> frame,
                              ErrorCode errorCode,
                              const CefString& errorText,
                              const CefString& failedUrl) {
    CEF_REQUIRE_UI_THREAD();

    if (errorCode == ERR_ABORTED)
        return;

    if (AppConfig::IsDebugMode() && failedUrl.ToString().find("localhost:3000") != std::string::npos) {
        std::string errorHtml = R"(
            <html>
            <head><title>Development Server Not Running</title></head>
            <body style="font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5;">
                <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #e74c3c; margin-top: 0;">🚫 Development Server Not Running</h1>
                    <p>The React development server is not running on <strong>localhost:3000</strong>.</p>
                    <h3>To start the development server:</h3>
                    <ol>
                        <li>Open a terminal in the <code>renderer</code> directory</li>
                        <li>Run: <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">bun run dev</code></li>
                        <li>Wait for the server to start</li>
                        <li>Refresh this page</li>
                    </ol>
                    <p style="margin-top: 30px; padding: 15px; background: #e8f4f8; border-left: 4px solid #3498db; border-radius: 4px;">
                        <strong>💡 Tip:</strong> The development server provides hot reloading and debugging features.
                    </p>
                </div>
            </body>
            </html>
        )";
        frame->LoadURL("data:text/html," + errorHtml);
        return;
    }

    std::string errorHtml = "<html><body bgcolor=\"white\">" +
                           std::string("<h2>Failed to load URL ") +
                           std::string(failedUrl) +
                           std::string(" with error ") +
                           std::string(errorText) +
                           std::string(" (") +
                           std::to_string(errorCode) +
                           std::string(").</h2></body></html>");
    frame->LoadURL("data:text/html," + errorHtml);
}

void SimpleClient::OnLoadStart(CefRefPtr<CefBrowser> browser,
                              CefRefPtr<CefFrame> frame,
                              TransitionType transition_type) {
    CEF_REQUIRE_UI_THREAD();
    
    if (frame->IsMain()) {
        std::string mode = AppConfig::IsDebugMode() ? "DEBUG" : "RELEASE";
        Logger::LogMessage("Loading page in " + mode + " mode...");
    }
}

void SimpleClient::OnLoadEnd(CefRefPtr<CefBrowser> browser, CefRefPtr<CefFrame> frame, int httpStatusCode) {
    if (AppConfig::IsDarkThemeEnabled()) {
        // Inject dark mode CSS
        std::string darkModeScript = R"(
            (function() {
                const style = document.createElement('style');
                style.textContent = `
                    :root {
                        color-scheme: dark;
                    }
                    body {
                        background-color: #1e1e1e !important;
                        color: #ffffff !important;
                    }
                `;
                document.head.appendChild(style);
                
                // Set prefers-color-scheme to dark
                if (window.matchMedia) {
                    window.matchMedia('(prefers-color-scheme: dark)').matches = true;
                }
            })();
        )";
        
        frame->ExecuteJavaScript(darkModeScript, frame->GetURL(), 0);
    }
}

void SimpleClient::CloseAllBrowsers(bool force_close) {
    if (!CefCurrentlyOn(TID_UI)) {
        CefPostTask(TID_UI, new CloseBrowserTask(this, force_close));
        return;
    }

    if (browser_list_.empty())
        return;

    BrowserList::const_iterator it = browser_list_.begin();
    for (; it != browser_list_.end(); ++it)
        (*it)->GetHost()->CloseBrowser(force_close);
}

void SimpleClient::DoCloseAllBrowsers(bool force_close) {
    if (browser_list_.empty())
        return;

    BrowserList::const_iterator it = browser_list_.begin();
    for (; it != browser_list_.end(); ++it)
        (*it)->GetHost()->CloseBrowser(force_close);
}

CefRefPtr<CefBrowser> SimpleClient::GetFirstBrowser() {
    if (!browser_list_.empty()) {
        return browser_list_.front();
    }
    return nullptr;
}

bool SimpleClient::HasBrowsers() {
    return !browser_list_.empty();
}