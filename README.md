# an-test-app-for-multiplayer-video

确保电脑安装nodejs10以上的版本

git clone 所有的代码

cd app 

npm install

下载electron可能会出现问题，这个需要你自己修改electron的镜像

npm run start 

可以开启electron桌面应用打开窗口了

cd server ;

我这边没有给一个json文件到server文件夹；

你需要打开控制台
npm install ws --save-dev

可以采用node server.js开启服务端设置，就可以愉快地在本机上玩耍了。

由于electron 使用的是 Chromium充当页面，可以极大地去掉恼人的兼容性问题。

网页版也只需要把html渲染到页面上即可，无需做额外的设置
