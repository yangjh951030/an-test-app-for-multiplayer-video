function init(){  // 初始化建立websocket
    return new Promise(function(resovle,reject){
        ws = new WebSocket('ws://localhost:7000');
        ws.onopen =  function(){
            console.log('建立websoket连接');
            resovle();
        }
        ws.onerror = function(e){
            alert('连接出现错误' + e );
            reject(e);
        }
        ws.onmessage =  function(message){
            let data = message.data;
            let trueData;
            try{
                trueData =  JSON.parse(data);
            }catch(e){
                console.log(e)
            }
            judgeMessage(trueData)    
        }
        ws.onclose =  function(){
            console.log('close ');
            clear(); // 关闭之后把所有的东西都初始化
        }
    })
}
function judgeMessage(data){ // 判断返回的信息
    switch(data.type){
        case 'login':
            judgeLogin(data); // 判断是否登录成功
            break;
        case 'invite':
            inviteOpepration(data); // 被邀请之后需要做哪些事情
            break;
        case 'refuse':
            handleRefuse(data); // 被拒绝后需要做什么事情
            break;
        case 'close':
            closeOperation(data); // 有用户注销登陆
            break;
        case 'offer':
            handleOffer(data); // 收到别人发来的offer，应该回一个answer
            break;
        case 'answer':
            handleAnswer(data); // 收到answer ，应该设置
            break;
        case 'candidate':
            handleCandidate(data); // 收到candidate,应该做什么
            break;
        case 'leave':
            handleLeave(data); // 有人离开需要做什么事情
            break;
        case 'message':
            handleMessage(data); // 收到信息的操作
            break;
        default:
            break;
    }
}
function judgeLogin(data){ // 判断登录情况
    if(data.success === true){
        loginBtn.setAttribute("disabled",'disabled');
        appendMessage(data.message) // 所有人都知道您上线了
        openCarema();
    }else{
        alert(data.message) // message = '用户已登录'
    }
}

function handleRefuse(data){ // 处理 拒绝按钮
    appendMessage(data.message);
}
function openCarema(){ // 收到和发送者的操作，打开摄像头
    if(stream === undefined){
        navigator.mediaDevices.getUserMedia({video:true,audio:false})
        .then(function(mediaStream){
            stream = mediaStream;
            localVideo.srcObject = mediaStream;
            caremaStatus = true;
            localVideo.onloadeddata =  function(e){
                localVideo.play();
            }
        }).catch(e=>{
            console.log(e)
        })
    }
}
function closeOperation(data){ // 有人离开需要做什么
    appendMessage(data.message); 
    let leaveUser = data.user;
    let remoteVideo = document.getElementById(leaveUser); // 清除离开者的视频video
    if(remoteVideo){ // 删除掉他的视频通信
        videoContent.removeChild(remoteVideo);
    }
    let conn = connection[leaveUser]; // 删掉offer，answer，connection
    if(conn !== undefined){ // 清空对应的connection
        conn.close();
        conn.onicecandidate = null; 
        conn.onaddstream = null; 
    }
    delete connection[leaveUser];
    delete offers[leaveUser];
    delete answers[leaveUser];
}
function inviteOpepration(data){  //connectUsers=[a,b]
    if(data.success === false){ // 被邀请了，打开邀请弹窗，
        appendMessage(data.message);
        return false
    }
    if(ownTo === undefined){
        ownTo = data.ownTo; // 被邀请了，设置一个
    }else{
        if(ownTo !== data.ownTo){ // 被第二个人邀请,不应该可以邀请
            return 
        }
    }
    inviteModal.style.display = 'block'; 
    inviteMessage.innerText = data.user + '邀请你进行视频';
    if(modalTimer === undefined){
        modalTimer = setTimeout(() => {
            refuse();
            modalTimer = undefined;
        }, 10000); // 10秒没有点击，直接自动触发
    }else{
        clearTimeout(modalTimer);
    }
    // 可以添加一个确定按钮；
    connectUsers = data.connectUsers; // C要为a，b都创建一个链接，记录群聊的人数
}
function clear(){ // ws关闭的操作，暂时没有使用
    user = undefined;
    stream = undefined;
    connection = {};
    offers = {};
    answers = {};
    connectUser = undefined;
}
function appendMessage(message = 'test message'){ // 收到信息需要append到页面上
    let P = document.createElement('p');
    P.innerText = message;
    messageContent.appendChild(P)
}
function handleOffer(data){ // a,b都收到了offer
    let name = data.user; // 拿到发来offer的人
    let RTCPeerConnection = connection[name];
    if(RTCPeerConnection === undefined){ // 判断本机有没有这个人
        console.log('本机没有这个链接，需要创建')
        RTCPeerConnection = createConnection(name); // 没有的话创建一个
    }
    console.log(RTCPeerConnection);
    RTCPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer)); // 收到offer就应该创建answer
    RTCPeerConnection.createAnswer(function(answer){
        RTCPeerConnection.setLocalDescription(answer); // 为c创建一个answer
        answers[name] = answer; // 把answer发给传来offer的人
        let message = {
            type:'answer',
            answer:answer,
            connectUser:data.user,
            sendTo:data.user
        }
        sendMessage(message);
    },function(e){
        console.log(e);
        alert('创建answer失败')
    })
}
function handleAnswer(data){ // 处理收到的answer; 发送offer者的操作，c收到a，b的answer，表明可以开始连接
    let name =  data.user; // 本机和发来消息者的名字
    let RTCPeerConnection = connection[name];
    RTCPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
}
function handleCandidate(data){ // 本机和接收者都要做的工作
    let name = data.user // 本机和发来消息者的名字
    let RTCPeerConnection =  connection[name];
    RTCPeerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}
function handleLeave(data){ // 离开操作和直接挂断是一样的操作
    closeOperation(data);
}
function handleMessage(data){ // 收到聊天信息
    appendMessage(data.message);
}


