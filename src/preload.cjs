const {contextBridge,ipcRenderer}=require('electron');
const call=(name)=>(...args)=>ipcRenderer.invoke('deck:'+name,...args);
const listen=(name,fn)=>{const handler=(_event,data)=>fn(data);ipcRenderer.on('deck:'+name,handler);return()=>ipcRenderer.removeListener('deck:'+name,handler);};
contextBridge.exposeInMainWorld('deck',{
 cameraBounds:call('camera-bounds'),cameraAction:call('camera-action'),camerasSave:call('cameras-save'),onCameraStatus:fn=>listen('camera-status',fn),retryKey:call('key-retry'),onKeyStatus:fn=>listen('key-status',fn),podcastResolve:call('podcast-resolve'),podcastsSave:call('podcasts-save'),arcadeRead:call('arcade-read'),arcadeRecord:call('arcade-record'),init:call('init'),xBounds:call('x-bounds'),xAction:call('x-action'),onXStatus:fn=>listen('x-status',fn),onShown:fn=>listen('shown',fn),artwork:call('artwork'),save:call('save'),resize:call('resize'),radio:call('radio'),episodes:call('episodes'),setKey:call('key'),videoId:call('video-id'),external:call('external'),maximize:call('maximize'),onWindowState:fn=>listen('window-state',fn),hide:call('hide'),quit:call('quit'),move:call('move'),
 onMetrics:fn=>listen('metrics',fn),onPause:fn=>listen('pause',fn),onHidden:fn=>listen('hidden',fn),onQuit:fn=>listen('quit',fn)
});
