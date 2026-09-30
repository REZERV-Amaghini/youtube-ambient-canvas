'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const routes={'/watch':'tests/fixture.html','/live_chat':'tests/chat-fixture.html','/ambient.css':'ambient.css','/ambient.js':'ambient.js','/renderer.js':'renderer.js','/firefox-check':'tests/firefox-check.html','/check-renderer.js':'tests/check-renderer.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer((req,res)=>{
  if(req.method==='POST'&&req.url==='/test-result'){
    let body='';req.on('data',chunk=>{body+=chunk;if(body.length>20000)req.destroy();});
    req.on('end',()=>{console.log('RENDERER_RESULT '+body);res.end('ok');});return;
  }
  const file=routes[new URL(req.url,'http://localhost').pathname];
  if(!file){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',types[path.extname(file)]);res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(path.join(root,file)));
});
server.listen(0,'127.0.0.1',()=>console.log('http://127.0.0.1:'+server.address().port+'/watch'));
