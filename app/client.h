#pragma once

#include "config.h"
#include <include/cef_client.h>
#include <include/cef_display_handler.h>
#include <include/cef_life_span_handler.h>
#include <include/cef_load_handler.h>
#include <include/cef_process_message.h>
#include <list>

class MikoClient : public CefClient,
                   public CefDisplayHandler,
                   public CefLifeSpanHandler,
                   public CefLoadHandler {
public:
    explicit MikoClient(const Config& config);
    ~MikoClient();
    
    // CefClient methods
    virtual CefRefPtr<CefDisplayHandler> GetDisplayHandler() override {
        return this;
    }
    
    virtual CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override {
        return this;
    }
    
    virtual CefRefPtr<CefLoadHandler> GetLoadHandler() override {
        return this;
    }
    
    virtual bool OnProcessMessageReceived(
        CefRefPtr<CefBrowser> browser,
        CefRefPtr<CefFrame> frame,
        CefProcessId source_process,
        CefRefPtr<CefProcessMessage> message) override;
    
    // CefLifeSpanHandler methods
    virtual void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
    virtual bool DoClose(CefRefPtr<CefBrowser> browser) override;
    virtual void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;
    
    // CefLoadHandler methods
    virtual void OnLoadError(CefRefPtr<CefBrowser> browser,
                           CefRefPtr<CefFrame> frame,
                           ErrorCode errorCode,
                           const CefString& errorText,
                           const CefString& failedUrl) override;
    
    // Custom methods
    void CloseAllBrowsers(bool force_close);
    bool IsClosing() const;
    
private:
    typedef std::list<CefRefPtr<CefBrowser>> BrowserList;
    
    const Config& config_;
    BrowserList browser_list_;
    bool is_closing_;
    
    // Include the default reference counting implementation.
    IMPLEMENT_REFCOUNTING(MikoClient);
};