//定义页面的操作按钮
let stream; // 摄像头视频流
let connection = {}; // 创建的点对点人数
let offers = {};  // 创建的offer
let answers = {}; // 创建的answer
let user;  // 本机的用户i
let connectUser; // 要联系的人
let ws; // websocket实例
let ownTo; // 记录自己属于哪个聊天群组
let caremaStatus = false; // 记录摄像头是否打开
let messageData; // 发送的信息
let connectUsers; // 记录群组的人数，根据这个创建点对点实例
let localVideo = document.getElementById('localVideo'); // 本机自己的视频
let loginBtn =  document.getElementById('loginBtn'); // 登录按钮
let sendMessageBtn =  document.getElementById('sendMessageBtn'); // 发送信息按钮
let hangupBtn =  document.getElementById('hangupBtn'); // 离开挂断按钮
let userInput =  document.getElementById('userInput'); // 用户id输入框
let messageInput =  document.getElementById('messageInput'); // 信息输入框
let callInput =  document.getElementById('callInput'); // 邀请人输入框
let callBtn =  document.getElementById('callBtn'); // 邀请按钮
let messageContent =  document.getElementById('messageContent'); // 聊天栏，系统或者群聊的信息都会在这里显示
let videoContent =  document.getElementById('videoContent'); // 视频栏，多少人在里面就会有多少个视频
let refuseBtn =  document.getElementById('refuseBtn'); // 拒绝视频按钮
let agreeBtn =  document.getElementById('agreeBtn'); // 同意视频按钮
let inviteMessage = document.getElementById('inviteMessage'); // 邀请弹窗的title
let inviteModal = document.getElementById('inviteModal'); // 邀请弹窗
let modalTimer; // 定义一个modal的定时器，如果时间内不回复，表示拒绝
function sendMessage(message){ // 向服务器发送消息
    if(user !== undefined) {
        message.user = user;
    }else {
        alert('用户未登录，无法发送任何消息');
        return false;
    }
    ws.send(JSON.stringify(message));
}
refuseBtn.addEventListener('click',function(){ // 拒绝视频操作
    refuse();
})
function refuse(){ // 拒绝视频操作
    clearTimeout(modalTimer);
    modalTimer = undefined;
    inviteModal.style.display = 'none';
    let message = {
        type:'refuse',
        sendTo:ownTo,
        onwTo:ownTo
    }
    sendMessage(message);
}
agreeBtn.addEventListener('click',function(){ // 同意按钮操作
    inviteModal.style.display = 'none';
    clearTimeout(modalTimer);
    modalTimer = undefined;
    agreeOperation(connectUsers); // 同意即可
})
function agreeOperation(connectUsers){
    for(let item of connectUsers){ // // 为所有在聊天室都新创建一个 RTCPeerConnection
        //createConnection(user + '-' + item);
        let conn =  connection[item];
        if(conn === undefined){
            conn = createConnection(item);
        }
        createOffer(conn,item) // 为a,b都创建一个offer
    }
}
function  createConnection(name = ''){ // 发送者的操作,创建RTCPeerConnection
    var configuration = { 
        "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
    }; 
    let RTCPeerConnection = new webkitRTCPeerConnection(configuration);
    connection[name] = RTCPeerConnection;
    RTCPeerConnection.addStream(stream);
    let remoteVideo =  document.createElement('video');
    remoteVideo.setAttribute("id",name);
    videoContent.appendChild(remoteVideo);
    RTCPeerConnection.onaddstream = function (e) { 
        console.log('加载远程视频流')
        remoteVideo.srcObject = e.stream ; 
        remoteVideo.play();
    };
    RTCPeerConnection.onicecandidate = function (event) { 
        if (event.candidate) { 
            sendMessage({ 
                type: 'candidate', 
                candidate: event.candidate, //{type,candidate,user,connectUser}
                sendTo:name
            }); 
        } 
    };
    return RTCPeerConnection;
}
function createOffer(RTCPeerConnection,name){ // 发送者的操作
    RTCPeerConnection.createOffer(function(offer){
        offers[name] = offer;
        let message = {
            type:'offer',
            offer:offer,
            sendTo:name
        }
        sendMessage(message); // {type,offer,user,connectUser}
        RTCPeerConnection.setLocalDescription(offer);
    },function(e){
        console.log(e);
        alert('创建offer失败');
    })
}
callInput.addEventListener('change',function(e){ // 输入框改变，同步修改connectuser
    console.log(e.target.value);
    connectUser = e.target.value;
})
messageInput.addEventListener('change',function(e){ // 消息输入框
    console.log(e.target.value);
    messageData = e.target.value;
})
userInput.addEventListener('change',function(e){
    user = e.target.value;
})
sendMessageBtn.addEventListener('click',function(e){
    if(user === undefined){
        alert('用户未登录，无法发送任何消息')
        return
    }
    if(messageData !== undefined && messageData.length > 0){
        let data = {
            type:'message',
            ownTo:ownTo,
            note:messageData
        }
        sendMessageBtn.setAttribute('disabled', 'disabled')
        sendMessage(data);
        setTimeout(function() {
            sendMessageBtn.removeAttribute('disabled')
        }, 5000);
    }else{
        alert('非法输入')
    }
})
callBtn.addEventListener('click',function(e){
    connectUser = callInput.value;
    if(connectUser.length < 1 ){
        alert('连接人物名字非法');
        return 
    }
    if(user === undefined){
        alert('改用户不存在');
        return 
    }
    callBtn.setAttribute('disabled', 'disabled')
    invite(connectUser);
    setTimeout(function() {
        callBtn.removeAttribute('disabled')
    }, 10000);
})
function invite(man){ // 邀请人的时候
    let message = {
        type:'invite',
        sendTo:man
    }
    if(ownTo === undefined){ // 表示还没有人邀请，我是邀请发起人,把聊天室属于人付给我自己
        ownTo =  user;
    }
    message.ownTo = ownTo; 
    sendMessage(message);
}
loginBtn.addEventListener('click', function(){
    if(user === undefined || user.length < 1){
        alert('user的名字太短或者不存在');
        return false;
    }
    if(ws === undefined){
        init().then(()=>{
            let type = 'login';
            let message = {};
            message.type = type;
            sendMessage(message);
        })
    }else{
        let type = 'login'; // {type:'login,user:user,connectuser:无}
        let message = {};
        message.type = type;
        sendMessage(message);
    }
    //clear() // 清除前用户的信息
})
hangupBtn.addEventListener('click',function(){
    if(user === undefined){
        return 
    }
    if(ws === undefined){
        return 
    }
    let message = {
        type:'leave',
        ownTo:ownTo,
    }
    sendMessage(message);
    clearAll();
})
function clearAll(){ // 本机离开，需要注销这些操作
    for(let item in connection){ // 这也是为什么要求用户是字母而不是数字
        let video =  document.getElementById(item);
        videoContent.removeChild(video);
    }
    connection = {};
    answers = {};
    offers = {};
    ownTo = undefined;
    connectUser = undefined;
}