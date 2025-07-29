#include "client.h"
#include "logger.h"
#include <include/cef_app.h>
#include <include/cef_client.h>
#include <include/wrapper/cef_helpers.h>

MikoClient::MikoClient(const Config& config) 
    : config_(config)
    , is_closing_(false) {
}

MikoClient::~MikoClient() {
}

bool MikoClient::OnProcessMessageReceived(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    CefProcessId source_process,
    CefRefPtr<CefProcessMessage> message) {
    
    CEF_REQUIRE_UI_THREAD();
    
    const std::string& message_name = message->GetName();
    Logger::getInstance().debug("Received message: " + message_name);
    
    // Handle custom messages from renderer process
    if (message_name == "miko_ready") {
        Logger::getInstance().info("MikoIDE renderer is ready");
        return true;
    }
    
    return false;
}

void MikoClient::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
    CEF_REQUIRE_UI_THREAD();
    
    browser_list_.push_back(browser);
    Logger::getInstance().info("Browser created, ID: " + std::to_string(browser->GetIdentifier()));
}

bool MikoClient::DoClose(CefRefPtr<CefBrowser> browser) {
    CEF_REQUIRE_UI_THREAD();
    
    Logger::getInstance().info("Browser closing, ID: " + std::to_string(browser->GetIdentifier()));
    
    // Allow the close. For windowed browsers this will result in the OS close
    // event being sent.
    return false;
}

void MikoClient::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
    CEF_REQUIRE_UI_THREAD();
    
    // Remove from the list of existing browsers.
    BrowserList::iterator bit = browser_list_.begin();
    for (; bit != browser_list_.end(); ++bit) {
        if ((*bit)->IsSame(browser)) {
            browser_list_.erase(bit);
            break;
        }
    }
    
    if (browser_list_.empty()) {
        // All browser windows have closed. Quit the application message loop.
        is_closing_ = true;
        CefQuitMessageLoop();
    }
    
    Logger::getInstance().info("Browser closed, ID: " + std::to_string(browser->GetIdentifier()));
}

void MikoClient::OnLoadError(CefRefPtr<CefBrowser> browser,
                            CefRefPtr<CefFrame> frame,
                            ErrorCode errorCode,
                            const CefString& errorText,
                            const CefString& failedUrl) {
    CEF_REQUIRE_UI_THREAD();
    
    // Don't display an error for downloaded files.
    if (errorCode == ERR_ABORTED)
        return;
    
    Logger::getInstance().error("Load error: " + errorText.ToString() + " URL: " + failedUrl.ToString());
    
    // Display a load error message using a data: URI.
    std::stringstream ss;
    ss << "<html><body bgcolor=\"white\">";
    ss << "<h2>Failed to load URL " << std::string(failedUrl) << "</h2>";
    ss << "<p>Error: " << std::string(errorText) << " (" << errorCode << ")</p>";
    ss << "</body></html>";
    
    frame->LoadURL("data:text/html," + ss.str());
}

void MikoClient::CloseAllBrowsers(bool force_close) {
    if (!CefCurrentlyOn(TID_UI)) {
        // Execute on the UI thread.
        CefPostTask(TID_UI, base::BindOnce(&MikoClient::CloseAllBrowsers, this, force_close));
        return;
    }
    
    if (browser_list_.empty())
        return;
    
    BrowserList::const_iterator it = browser_list_.begin();
    for (; it != browser_list_.end(); ++it)
        (*it)->GetHost()->CloseBrowser(force_close);
}

bool MikoClient::IsClosing() const {
    return is_closing_;
}