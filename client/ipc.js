 // 窗口通信
// const  { contextBridge, ipcRenderer } = require('electron');electron使用contextBridge,不需要引入ipcRenderer

let smallBtn =  document.getElementById('smallBtn');
let restoreBtn =  document.getElementById('restoreBtn');
let closeBtn =  document.getElementById('closeBtn');

smallBtn.addEventListener('click',function(){ // 缩小窗口
    console.log('samll the browser')
    window.electron.small()
    //ipcRenderer.send('browserOperation','small','main')
})
restoreBtn.addEventListener('click',function(){ // 复原窗口
    console.log('samll the browser')
    window.electron.restore()
    //ipcRenderer.send('browserOperation','restore','main')
})
closeBtn.addEventListener('click',function(){ // 关闭窗口
    console.log('samll the browser')
    window.electron.close()
    //ipcRenderer.send('browserOperation','close','main')
})