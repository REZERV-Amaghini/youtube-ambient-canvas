'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const routes={'/watch':'tests/fixture.html','/live_chat':'tests/chat-fixture.html','/ambient.css':'ambient.css','/ambient.js':'ambient.js','/settings-store.js':'settings-store.js','/black-bar-detector.js':'black-bar-detector.js','/renderer.js':'renderer.js','/flash-monitor.js':'flash-monitor.js','/worker-client.js':'worker-client.js','/worker-host.html':'worker-host.html','/worker-host.js':'worker-host.js','/ambient-worker.js':'ambient-worker.js','/firefox-check':'tests/firefox-check.html','/check-renderer.js':'tests/check-renderer.js','/test-theme.css':'.tool-cache/deepdark.css','/baseline-ambient.css':'.tool-cache/ambient-v022.css','/baseline-ambient.js':'.tool-cache/ambient-v022.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
Object.assign(routes, {'/gpu-check':'tests/gpu-fixture.html', '/check-gpu-browser.js':'tests/check-gpu-browser.js', '/gpu-renderer.js':'gpu-renderer.js'});
const server=http.createServer((req,res)=>{
  if(req.method==='POST'&&req.url==='/test-result'){
    let body='';req.on('data',chunk=>{body+=chunk;if(body.length>20000)req.destroy();});
    req.on('end',()=>{console.log('RENDERER_RESULT '+body);res.end('ok');});return;
  }
  const file=routes[new URL(req.url,'http://localhost').pathname];
  if(!file||!fs.existsSync(path.join(root,file))){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',types[path.extname(file)]);res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(path.join(root,file)));
});
server.listen(0,'127.0.0.1',()=>console.log('http://127.0.0.1:'+server.address().port+'/watch'));
