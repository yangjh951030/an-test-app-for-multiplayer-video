const server = require('ws').Server;
let myServer = new server({port:7000});
let users = {};
let commucations = {};
function send(connection,message){ // 通知单个人
    connection.send(JSON.stringify(message))
}
function sendAll(message){ // 通知所有人
    for(let item in users){
        users[item].send(JSON.stringify(message))
    }
}
myServer.on('connection',function(connection){
    console.log('connection is starting');
    connection.on('message',function(data){
        let message;
        let backMessage;
        let conn;
        let rooms = [];
        try{
            message = JSON.parse(data);
            console.log(message);
        }catch(e){
            console.log(e);
        }
        switch(message.type){
            case 'login':
                let loginUser = users[message.user]
                if(loginUser !== undefined) { // 表示这个人已经连接
                    backMessage = {
                        type:'login',
                        success:false,
                        message:'用户已登录',
                        user:message.user
                    }
                    send(connection,data)
                }else{ // 这个用户是首登
                    connection.name = message.user; // 把用户名赋予connection
                    users[message.user] = connection; // users保存这个connection
                    backMessage = {
                        type:'login',
                        success:true,
                        message:message.user + ' 登录上线了',
                        user:message.user
                    }
                    sendAll(backMessage);   // 给所有人发送
                }
                break;
            case 'invite': // sendto;邀请者把自己聊天室的人物发给被邀请人,邀请之后才会形成一个聊天室
                let connectUsers = commucations[message.ownTo];
                let ownTo = message.ownTo;
                if(connectUsers === undefined){ // 聊天室还没创建,开始创建
                    let room = [];
                    room.push(message.user);
                    commucations[message.ownTo] = room;
                    connectUsers = commucations[message.ownTo];
                }
                 // 连接之后创建一个自己的聊天室数组
                conn = users[message.sendTo]; // 找到被邀请的人 
                console.log(connectUsers);
                if(conn !== undefined){
                    send(conn,{
                        type:'invite',
                        connectUsers:connectUsers,
                        user:message.user,
                        success:true,
                        ownTo:ownTo
                    })
                    commucations[message.ownTo].push(message.sendTo) // 发送之后再更新自己的，和接收方的
                }else {
                    send(connection,{
                        type:'invite',
                        message:'该用户拒绝了或者不存在',
                        success:false
                    })
                }
                break;
            case "refuse": // 拒绝的时候
                conn = users[message.sendTo];
                if(conn !== undefined){
                    send(conn,{
                        type:'refuse',
                        message:message.user +  '暂时不想和您视频通信',
                        user:message.user
                    })
                    let group = commucations[message.ownTo];
                    let index;
                    if(group !== undefined){
                        index = group.indexOf(message.user);
                        group.splice(index,1); // 拒绝就删掉这个人
                    }  
                }else{
                    console.log('没有可拒绝的用户')
                }
                break;
            case "offer":
                conn = users[message.sendTo];
                if(conn !== undefined){
                    send(conn,{
                        type:'offer',
                        offer:message.offer,
                        user:message.user
                    })
                }else {
                    console.log('没有这个人')
                }
                break;
            case 'answer':
                conn = users[message.sendTo];
                if(conn !== undefined){
                    send(conn,{
                        type:'answer',
                        answer:message.answer,
                        user:message.user
                    })
                }else {
                    console.log('没有这个人')
                }
                break;
            case 'candidate':
                conn = users[message.sendTo];
                if(conn !== undefined){
                    send(conn,{
                        type:'candidate',
                        candidate:message.candidate,
                        user:message.user,
                    })
                }
                break;
            case 'message':
                rooms = commucations[message.ownTo]; // 发送消息只发给聊天室内的人
                if(rooms !== undefined){
                    backMessage = {
                        type:'message',
                        user:message.user,
                        message:'来自'+ message.user + '的消息：' + message.note
                    }
                    for(let item of rooms){
                        send(users[item],backMessage)
                    }
                }else{
                    console.log('该聊天是不存在')
                }
                break;
            case 'leave':
                rooms = commucations[message.ownTo]// 拿到聊天室的人物；
                if(rooms !== undefined && message.ownTo !== message.user){ // 不能是楼主设置离开，否则需要做其他的设置
                    let index = rooms.indexOf(message.user);
                    rooms.splice(index,1); // 此人离开就应该删掉这个人在聊天室的所有信息
                    backMessage = {
                        type:'leave',
                        user:message.user,
                        message:message.user + ' 离开了'
                    }
                    for(let item of rooms){
                        send(users[item],backMessage)
                    }
                }else{
                    console.log('单人，无需告知其他人情况')
                }
                break;
            default:
                break;
        }

    })
    connection.on('close',function(){
        backMessage = {
            type:'close',
            message:connection.name + ' 离开了',
            user:connection.name
        }
        sendAll(backMessage);
        let group =  getGroup(commucations,connection.name); // 拿到成员的群组，删除掉这个成员
        let index =  group.indexOf(connection.name)
        console.log(group)
        if(group !== undefined){
            group.splice(index,1);
        }
        console.log(group)
        delete users[connection.name];
        if(commucations[connection.name] !== undefined){
            delete commucations[connection.name];
        }
        console.log('connection is close');
    })
})
function getGroup(groups,name){
    let group = [];
    for(let item in groups){
        if(groups[item].indexOf(name) > -1){
            group = groups[item];
            break;
        }
    }
    return group;
}