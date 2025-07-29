const { app, BrowserWindow, nativeTheme } = require('electron');
const path = require('path');

function createWindow() {
    // Set dark theme
    nativeTheme.themeSource = 'dark';
    
    // Create the browser window
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false // Allow loading localhost
        },
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#00000000', // Transparent background
            symbolColor: '#ffffff',
            height: 40
        },
        backgroundColor: '#16181D', // Match your app's dark background
        show: false, // Don't show until ready
        title: 'MikoIDE Preview - localhost:5173'
    });

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Load localhost:5173
    mainWindow.loadURL('http://localhost:5173');

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    mainWindow.on('closed', () => {
        app.quit();
    });

    // Handle navigation errors (if localhost:5173 is not available)
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.log('Failed to load:', validatedURL);
        console.log('Error:', errorDescription);

        // Show error page with dark theme
        mainWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
        <head>
            <title>Connection Error</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background-color: #16181D;
                    color: #cccccc;
                    text-align: center;
                    padding: 50px;
                    margin: 0;
                }
                h1 { color: #ffffff; }
                button {
                    background-color: #0E639C;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                }
                button:hover {
                    background-color: #1177BB;
                }
            </style>
        </head>
        <body>
          <h1>Cannot connect to localhost:5173</h1>
          <p>Make sure your development server is running on port 5173</p>
          <p>Error: ${errorDescription}</p>
          <button onclick="location.reload()">Retry</button>
        </body>
      </html>
    `);
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle certificate errors for localhost
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (url.startsWith('http://localhost:5173')) {
        // Ignore certificate errors for localhost
        event.preventDefault();
        callback(true);
    } else {
        callback(false);
    }
});