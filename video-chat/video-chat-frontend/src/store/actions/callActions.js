//呼叫设置
export const CALL_SET_LOCAL_STREAM = 'CALL_SET_LOCAL_STREAM';
export const CALL_SET_CALL_STATE = 'CALL_SET_CALL_STATE';
export const CALL_SET_CALLING_DIALOG_VISIBLE =
  'CALL_SET_CALLING_DIALOG_VISIBLE';
export const CALL_SET_CALLER_USERNAME = 'CALL_SET_CALLER_USERNAME';
export const CALL_SET_CALL_REJECTED = 'CALL_SET_CALL_REJECTED';
export const CALL_SET_REMOTE_STREAM = 'CALL_SET_REMOTE_STREAM';
export const CALL_SET_LOCAL_MICROPHONE_ENABLED =
  'CALL_SET_LOCAL_MICROPHONE_ENABLED';
export const CALL_SET_LOCAL_CAMERA_ENABLED = 'CALL_SET_LOCAL_CAMERA_ENABLED';
export const CALL_SET_SCREEN_SHARING_ACTIVE = 'CALL_SET_SCREEN_SHARING_ACTIVE';
export const CALL_RESET_CALL_STATE = 'CALL_RESET_CALL_STATE';
export const CALL_SET_GROUP_CALL_ACTIVE = 'CALL_SET_GROUP_CALL_ACTIVE';
export const CALL_SET_GROUP_CALL_STREAMS = 'CALL_SET_GROUP_CALL_STREAMS';
export const CALL_CLEAR_GROUP_CALL_DATA = 'CALL_CLEAR_GROUP_CALL_DATA';
export const CALL_SET_CHAT_MESSAGE = 'CALL_SET_CHAT_MESSAGE';
//呼叫状态，便于管理组件：可用，不可用，请求，正在进行中
export const callStates = {
  CALL_UNAVAILABLE: 'CALL_UNAVAILABLE',
  CALL_AVAILABLE: 'CALL_AVAILABLE',
  CALL_REQUESTED: 'CALL_REQUESTED',
  CALL_IN_PROGRESS: 'CALL_IN_PROGRESS',
};

//设置本地媒体流
export const setLocalStream = (localStream) => {
  return {
    type: CALL_SET_LOCAL_STREAM,
    localStream,
  };
};
//设置呼叫状态
export const setCallState = (callState) => {
  return {
    type: CALL_SET_CALL_STATE,
    callState,
  };
};

//设置呼叫对话框的可见状态
export const setCallingDialogVisible = (visible) => {
  return {
    type: CALL_SET_CALLING_DIALOG_VISIBLE,
    visible,
  };
};

//设置呼叫者的用户姓名
export const setCallerUsername = (callerUsername) => {
  return {
    type: CALL_SET_CALLER_USERNAME,
    callerUsername,
  };
};

//设置通信拒绝
export const setCallRejected = (callRejectedDetails) => {
  return {
    type: CALL_SET_CALL_REJECTED,
    callRejected: {
      rejected: callRejectedDetails.rejected,
      reason: callRejectedDetails.reason,
    },
  };
};

//设置远端发送的stream媒体流
export const setRemoteStream = (remoteStream) => {
  return {
    type: CALL_SET_REMOTE_STREAM,
    remoteStream,
  };
};

//设置mic的开关
export const setLocalMicrophoneEnabled = (enabled) => {
  return {
    type: CALL_SET_LOCAL_MICROPHONE_ENABLED,
    enabled,
  };
};

//设置camera的开关
export const setLocalCameraEnabled = (enabled) => {
  return {
    type: CALL_SET_LOCAL_CAMERA_ENABLED,
    enabled,
  };
};

//设置共享屏幕的开关
export const setScrrenSharingActive = (active) => {
  return {
    type: CALL_SET_SCREEN_SHARING_ACTIVE,
    active,
  };
};

//重置挂断后的state状态
export const resetCallDataState = () => {
  return {
    type: CALL_RESET_CALL_STATE,
  };
};

//设置群组呼叫组件的显示状态
export const setGroupCallActive = (active) => {
  return {
    type: CALL_SET_GROUP_CALL_ACTIVE,
    active,
  };
};

//设置群组呼叫房间中的媒体流
export const setGroupCallIncomingStreams = (groupCallStreams) => {
  return {
    type: CALL_SET_GROUP_CALL_STREAMS,
    groupCallStreams,
  };
};

//重置离开群组呼叫房间后的状态
export const clearGroupCallData = () => {
  return {
    type: CALL_CLEAR_GROUP_CALL_DATA,
  };
};

//处理接收的聊天信息
export const setMessage = (messageReceived, messageContent) => {
  return {
    type: CALL_SET_CHAT_MESSAGE,
    message: {
      received: messageReceived,
      content: messageContent,
    },
  };
};
