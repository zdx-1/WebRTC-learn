import store from '../../store/store';
import {
  setLocalStream,
  setCallState,
  setCallingDialogVisible,
  setCallerUsername,
  callStates,
  setCallRejected,
  setRemoteStream,
  setScrrenSharingActive,
  resetCallDataState,
  setMessage,
} from '../../store/actions/callActions';
import * as wss from '../wssConnection/wssConnection';

//定义预呼叫回复状态
const preOfferAnswers = {
  CALL_ACCEPTED: 'CALL_ACCEPTED',
  CALL_REJECTED: 'CALL_REJECTED',
  //客观因素影响无法通信（对方正在通话中）
  CALL_NOT_AVAILABLE: 'CALL_NOT_AVAILABLE',
};

//默认定义
const defaultConstrains = {
  video: {
    width: 480,
    height: 360,
  },
  audio: true,
};

//configuration连接配置
const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

//获取通过socket连接的用户的socketId，让服务器知道谁在和谁通信
let connectUserSocketId;
let rejectedReason;
let peerConnection;
let dataChannel;
//获取用户的本地媒体流并保存到store中
export const getLocalStream = () => {
  navigator.mediaDevices
    .getUserMedia(defaultConstrains)
    .then((stream) => {
      store.dispatch(setLocalStream(stream));
      store.dispatch(setCallState(callStates.CALL_AVAILABLE));
      createPeerConnection();
    })
    .catch((error) => {
      console.log('尝试获取访问权限以获取本地媒体流时出错');
      console.log(error);
    });
};

//创建对等连接
const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration);
  //获取本地stream流
  const localStream = store.getState().call.localStream;

  //addTrack为初始化后的本地流对象添加音视频轨。若该本地流已经被发布，则该流会自动重新发布到远端。
  for (const track of localStream.getTracks()) {
    peerConnection.addTrack(track, localStream);
  }

  //每当远端的音视频数据传递过来的时候，onTrack事件就会被触发
  peerConnection.ontrack = ({ streams: [stream] }) => {
    //通过dispatch存储的stream到store中
    store.dispatch(setRemoteStream(stream));
  };

  //处理传入数据通道的信息
  peerConnection.ondatachannel = (event) => {
    const dataChannel = event.channel;
    //监听dataChannel是否开启
    dataChannel.onopen = () => {
      console.log('对等连接已经准备好接收数据通道的消息');
    };
    dataChannel.onmessage = (event) => {
      store.dispatch(setMessage(true, event.data));
    };
  };

  //创建数据通道
  dataChannel = peerConnection.createDataChannel('chat');
  dataChannel.onopen = () => {
    console.log('聊天数据通道已经成功开启');
  };

  //监听icecandidate事件并将更改后的描述信息传送给remote远端RTCPeerConnection并更新远端设备源
  peerConnection.onicecandidate = (event) => {
    //从STUN服务器获取ICE
    console.log('从Stun服务器获取ICE信息');
    if (event.candidate) {
      wss.sendWebRTCCandidate({
        candidate: event.candidate,
        connectUserSocketId: connectUserSocketId,
      });
    }
  };

  peerConnection.onconnectionstatechange = (event) => {
    if (peerConnection.connectionState === 'connected') {
      console.log('对等连接成功！');
    }
  };
};

//呼叫某个用户，获取应答者信息
export const callToOtherUser = (calleeDetails) => {
  connectUserSocketId = calleeDetails.socketId;
  //更新呼叫状态：呼叫进行中
  store.dispatch(setCallState(callStates.CALL_IN_PROGRESS));
  //显示呼叫对话框为可见状态
  store.dispatch(setCallingDialogVisible(true));

  wss.sendPreOffer({
    callee: calleeDetails,
    caller: {
      username: store.getState().dashboard.username,
    },
  });
};

//处理从服务器返回的呼叫者的数据，并存储它的sockeId以及callerUsername
export const handlePreOffer = (data) => {
  //判断是否不受客观通信因素影响
  if (checkIfCallPossible()) {
    console.log(checkIfCallPossible());
    connectUserSocketId = data.callerSocketId;
    //更新store中的callerUsername
    store.dispatch(setCallerUsername(data.callerUsername));
    //更新store中callState为：requested
    store.dispatch(setCallState(callStates.CALL_REQUESTED));
  } else {
    //受客观因素影响的情况下，通过服务器向发起方传达回复
    wss.sendPreOfferAnswer({
      callerSocketId: data.callerSocketId,
      answer: preOfferAnswers.CALL_NOT_AVAILABLE,
    });
  }
};

//创建验证通信可能的函数
export const checkIfCallPossible = () => {
  if (
    store.getState().call.localStream === null ||
    store.getState().call.callState !== callStates.CALL_AVAILABLE
  ) {
    //客观因素影响无法通信
    return false;
  } else {
    return true;
  }
};

//创建处理handlePreOfferAnswer的函数
export const handlePreOfferAnswer = (data) => {
  store.dispatch(setCallingDialogVisible(false));
  //验证answer结果，如果为CALL_ACCEPTED
  if (data.answer === preOfferAnswers.CALL_ACCEPTED) {
    // 进入到webRTC逻辑
    sendOffer();
  } else {
    if (data.answer === preOfferAnswers.CALL_NOT_AVAILABLE) {
      rejectedReason = '应答方现在无法接听电话';
    } else {
      rejectedReason = '应答方拒绝你的呼叫';
    }

    //dispatch 拒绝接听的action
    store.dispatch(
      setCallRejected({
        rejected: true,
        reason: rejectedReason,
      })
    );

    //重置data
    resetCallData();
  }
};

//发送offer SDP
const sendOffer = async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  //Offer发送SDP到信令服务器
  wss.sendWebRTCOffer({
    calleeSocketId: connectUserSocketId,
    offer: offer,
  });
};

//定义接受呼叫请求的函数
export const acceptIncomingCallRequest = () => {
  wss.sendPreOfferAnswer({
    callerSocketId: connectUserSocketId,
    answer: preOfferAnswers.CALL_ACCEPTED,
  });

  //接听后修改呼叫状态
  store.dispatch(setCallState(callStates.CALL_IN_PROGRESS));
};

//拒绝接听呼叫请求的函数
export const rejectIncomingCallRequest = () => {
  wss.sendPreOfferAnswer({
    callerSocketId: connectUserSocketId,
    answer: preOfferAnswers.CALL_REJECTED,
  });

  //拒绝之后重置
  resetCallData();
};

//应答方处理呼叫方传递过来的Offer SDP
export const handleOffer = async (data) => {
  await peerConnection.setRemoteDescription(data.offer);

  // 创建answer 的SDP
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  wss.sendWebRTCAnswer({
    callerSocketId: connectUserSocketId,
    answer: answer,
  });
};

//呼叫方处理应答方传递过来的Answer SDP
export const handleAnswer = async (data) => {
  await peerConnection.setRemoteDescription(data.answer);
};

//处理ICE
export const handleCandidate = async (data) => {
  try {
    //添加成功远程发送过来的ICE候选人
    console.log('添加 ICE 候选人信息');
    await peerConnection.addIceCandidate(data.candidate);
  } catch (error) {
    console.log('尝试添加收到的ICE候选人时出错', error);
  }
};

let screenSharingStream;
export const switchForScreenSharingStream = async () => {
  if (!store.getState().call.screenSharingActive) {
    try {
      //获取共享的stream
      screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      store.dispatch(setScrrenSharingActive(true));
      //从RTCpeerConnection中获取所有的senders（发送器）
      const senders = peerConnection.getSenders();
      //遍历每个sender,找到类型为video的sender
      const sender = senders.find(
        (sender) =>
          sender.track.kind === screenSharingStream.getVideoTracks()[0].kind
      );
      //替换远端视频
      sender.replaceTrack(screenSharingStream.getVideoTracks()[0]);
    } catch (error) {
      console.log('尝试获取屏幕共享流时出错', error);
    }
  } else {
    const localStream = store.getState().call.localStream;
    const senders = peerConnection.getSenders();
    //遍历每个sender,找到类型为video的sender
    const sender = senders.find(
      (sender) => sender.track.kind === localStream.getVideoTracks()[0].kind
    );
    //替换远端视频
    sender.replaceTrack(localStream.getVideoTracks()[0]);
    store.dispatch(setScrrenSharingActive(false));

    //停止清空轨道
    screenSharingStream.getTracks().forEach((track) => track.stop());
  }
};

//处理挂断
export const handleUserHangedUp = () => {
  resetCallDataAfterHangUp();
};

//通知挂断
export const hangUp = () => {
  //通过服务器向另一方告知想要挂断
  wss.sendUserHangedUp({
    connectUserSocketId: connectUserSocketId,
  });

  //挂断之后进行状态的重置
  resetCallDataAfterHangUp();
};

const resetCallDataAfterHangUp = () => {
  peerConnection.close();
  peerConnection = null;
  createPeerConnection();
  resetCallData();

  if (store.getState().call.screenSharingActive) {
    screenSharingStream.getTracks().forEach((track) => track.stop());
  }

  //重置state状态中的数据
  store.dispatch(resetCallDataState());
};

//定义呼叫重置函数
export const resetCallData = () => {
  connectUserSocketId = null;
  store.dispatch(setCallState(callStates.CALL_AVAILABLE));
};

//定义传递信息的函数
export const sendMessageUsingDataChannel = (message) => {
  dataChannel.send(message);
};
