const {contextBridge,ipcRenderer}=require('electron');
const call=(name)=>(...args)=>ipcRenderer.invoke('deck:'+name,...args);
const listen=(name,fn)=>{const handler=(_event,data)=>fn(data);ipcRenderer.on('deck:'+name,handler);return()=>ipcRenderer.removeListener('deck:'+name,handler);};
contextBridge.exposeInMainWorld('deck',{
 init:call('init'),xBounds:call('x-bounds'),xAction:call('x-action'),onXStatus:fn=>listen('x-status',fn),onShown:fn=>listen('shown',fn),artwork:call('artwork'),save:call('save'),resize:call('resize'),radio:call('radio'),episodes:call('episodes'),setKey:call('key'),videoId:call('video-id'),external:call('external'),hide:call('hide'),quit:call('quit'),move:call('move'),
 onMetrics:fn=>listen('metrics',fn),onPause:fn=>listen('pause',fn),onHidden:fn=>listen('hidden',fn),onQuit:fn=>listen('quit',fn)
});
