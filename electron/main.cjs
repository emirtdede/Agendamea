const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

// Windows 11 Taskbar & Jump List AppUserModelID (matches electron-builder appId)
if (process.platform === 'win32') {
  app.setAppUserModelId('dev.vellium.agendamea');
}

// Single-instance guard prevents duplicate colliding desktop windows & DB locks
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Fixed preferred local port keeps localStorage (anti-FOUC theme cache) stable across restarts
const PREFERRED_PORT = 47821;

let mainWindow = null;
let serverProcess = null;
let logFd = null;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function getAvailablePort(preferred = PREFERRED_PORT) {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.once('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && preferred !== 0) {
        resolve(getAvailablePort(0));
      } else {
        reject(err);
      }
    });
    srv.listen(preferred, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 3000;
      srv.close(() => resolve(port));
    });
  });
}

function openServerLogFd(userDataDir) {
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    const logPath = path.join(userDataDir, 'server.log');
    if (fs.existsSync(logPath) && fs.statSync(logPath).size > 256 * 1024) {
      fs.truncateSync(logPath, 0);
    }
    return fs.openSync(logPath, 'a');
  } catch {
    return 'ignore';
  }
}

function resolveRuntimeRoot() {
  const defaultRoot = path.join(__dirname, '..');
  if (defaultRoot.includes('app.asar')) {
    const unpackedRoot = defaultRoot.replace('app.asar', 'app.asar.unpacked');
    if (fs.existsSync(path.join(unpackedRoot, 'dist-server', 'server.mjs'))) {
      return unpackedRoot;
    }
  }
  return defaultRoot;
}

function resolveWindowIcon(runtimeRoot) {
  const candidates = [
    path.join(runtimeRoot, 'electron-resources', 'icon.ico'),
    path.join(runtimeRoot, 'dist', 'icons', 'agendamea.ico'),
    path.join(runtimeRoot, 'public', 'icons', 'agendamea.ico'),
    path.join(__dirname, '..', 'electron-resources', 'icon.ico'),
    path.join(__dirname, '..', 'public', 'icons', 'agendamea.ico'),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function isAllowedExternalUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'vellium.dev' || parsed.hostname === 'github.com')
    ) {
      return true;
    }
    if (parsed.protocol === 'mailto:' && parsed.pathname.toLowerCase() === 'support@vellium.dev') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function startBackend(port) {
  const runtimeRoot = resolveRuntimeRoot();
  const userDataDir = app.getPath('userData');
  const bundledServer = path.join(runtimeRoot, 'dist-server', 'server.mjs');
  const tsxCli = path.join(runtimeRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const devServer = path.join(runtimeRoot, 'server.ts');

  const args = fs.existsSync(bundledServer)
    ? [bundledServer]
    : fs.existsSync(tsxCli)
      ? [tsxCli, devServer]
      : [devServer];

  const stderrTarget = openServerLogFd(userDataDir);
  if (typeof stderrTarget === 'number') {
    logFd = stderrTarget;
  }

  // Always use writable userDataDir as cwd (avoids ASAR ENOTDIR / Program Files permission errors)
  serverProcess = spawn(process.execPath, args, {
    cwd: userDataDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(port),
      AGENDAMEA_DATA_DIR: userDataDir,
      AGENDAMEA_APP_ROOT: runtimeRoot,
    },
    stdio: ['ignore', 'ignore', stderrTarget],
    windowsHide: true,
  });
}

function stopBackend() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
  if (typeof logFd === 'number') {
    try {
      fs.closeSync(logFd);
    } catch {
      // Ignore already closed descriptor
    }
    logFd = null;
  }
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // Fail fast if backend process already crashed
    if (serverProcess && serverProcess.exitCode !== null) {
      return false;
    }
    try {
      const res = await fetch(`${url}/api/health`, {
        signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(1000) : undefined,
      });
      if (res.ok) return true;
    } catch {
      // Wait for server readiness
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function createWindow(appUrl) {
  const runtimeRoot = resolveRuntimeRoot();
  const allowedOrigin = new URL(appUrl).origin;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 860,
    minHeight: 580,
    frame: false,
    title: 'Agendamea',
    icon: resolveWindowIcon(runtimeRoot),
    backgroundColor: '#fafafa',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Allow only whitelisted Vellium links to open in the user's default browser/mail client
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    try {
      if (new URL(targetUrl).origin !== allowedOrigin) {
        event.preventDefault();
        if (isAllowedExternalUrl(targetUrl)) {
          void shell.openExternal(targetUrl);
        }
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', false);
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('window:maximized-changed', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('window:maximized-changed', mainWindow?.isMaximized() ?? false);
  });

  const ready = await waitForServer(appUrl);
  if (ready && mainWindow) {
    await mainWindow.loadURL(appUrl);
  } else if (mainWindow) {
    await mainWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        '<!doctype html><html lang="tr"><body style="font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fafafa;color:#111"><div style="text-align:center"><h2>Agendamea başlatılamadı</h2><p>Yerel sunucu başlatılamadı. Lütfen uygulamayı yeniden açın.</p></div></body></html>',
      )}`,
    );
    mainWindow.show();
  }
}

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:toggle-maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false);
    return false;
  }
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  }
  mainWindow.maximize();
  return true;
});

ipcMain.handle('window:is-maximized', () => {
  if (!mainWindow) return false;
  return mainWindow.isMaximized() || mainWindow.isFullScreen();
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

app
  .whenReady()
  .then(async () => {
    const port = process.env.PORT ? Number(process.env.PORT) : await getAvailablePort();
    const appUrl = `http://127.0.0.1:${port}`;
    startBackend(port);
    await createWindow(appUrl);
  })
  .catch((err) => {
    console.error('Agendamea Electron startup error:', err);
    stopBackend();
    app.quit();
  });

app.on('before-quit', () => {
  stopBackend();
});

app.on('window-all-closed', () => {
  stopBackend();
  app.quit();
});

process.on('exit', () => {
  stopBackend();
});
