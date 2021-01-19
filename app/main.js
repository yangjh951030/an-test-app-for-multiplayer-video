const {app , BrowserWindow,ipcMain, }  =  require('electron');
const path  = require('path')

let allBrowser = {}; // remote模块导致内存泄漏,暂时不引入该模块
function createWindow () {   
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation:true, // 上下文隔离
      preload:path.join(__dirname,'operation.js') // 
    },
    icon:'',
    frame:false,
  })
  
  // 并且为你的应用加载index.html
  win.loadFile('../client/client.html')
  win.setMenu(null); // 去掉目录
  allBrowser['main'] = win; // 存储窗口
  win.on('close',function(){
    app.quit(); // 主窗口关闭，所有的app停止运行
  })
  //win.setProgressBar(0.5) // 设置进度条
  // 打开开发者工具
  //win.webContents.openDevTools({detach:true})// 在新的地方打开窗口，而不是在窗口内
}
ipcMain.on('browserOperation',function(e,operation = 'small',browser = 'main'){ // 对窗口进行处理
  let whichBrowser;
  whichBrowser = allBrowser[browser];
  if(operation === 'restore'){ // 恢复或者最小化
    if(whichBrowser.isMaximized()){
      whichBrowser.unmaximize()
    }else{
      whichBrowser.maximize()
    }
  }else if(operation === 'close'){ // 关闭
    whichBrowser.close();
    // e.sender.send('del',whichBrowser.name) // 告知渲染端哪个窗口关闭了
  }else{  // 最小化
    if(whichBrowser.isMinimized()){
      whichBrowser.restore();
    }else{
      whichBrowser.minimize();
    }
  }
})

app.whenReady().then(createWindow)
  
//当所有窗口都被关闭后退出
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 您可以把应用程序其他的流程写在在此文件中
// 代码 也可以拆分成几个文件，然后用 require 导入。




