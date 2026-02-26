const { contextBridge: i, ipcRenderer: o } = require("electron");
i.exposeInMainWorld("electronAPI", {
  authorizeDevice: (e) => o.invoke("clover-authorize", e),
  loginUser: (e) => o.invoke("user-login", e),
  saveAuthSession: (e) => o.send("save-session", e)
});
