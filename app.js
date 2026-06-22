const $=s=>document.querySelector(s);let generated={};
const sampleHTML=`<header class="topbar"><a class="logo">Make+</a><nav><a>Inicio</a><a>Servicos</a><a>Contato</a></nav></header>
<section class="hero"><div><h1>Sites premium com performance</h1><p>Criamos landing pages, lojas e interfaces modernas.</p><a class="btn">Solicitar proposta</a></div></section>
<section class="cards"><article><h2>Design</h2><p>Layouts elegantes.</p></article><article><h2>SEO</h2><p>Estrutura otimizada.</p></article></section>
<footer><p>© 2026 Make+</p></footer>`;
const sampleCSS=`body{margin:0;font-family:Montserrat,Arial,sans-serif;color:#1D1D1D}.topbar{display:flex;justify-content:space-between;padding:28px 8%;background:#1D1D1D;color:white}.topbar a{margin:0 12px;color:inherit;text-decoration:none}.logo{color:#FC4C13!important;font-weight:800}.hero{min-height:70vh;display:grid;place-items:center;padding:8%;background:#f5f5f5}.hero h1{font-size:64px;max-width:760px}.btn{display:inline-block;background:#FC4C13;color:white;padding:16px 22px;border-radius:999px}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;padding:8%}.cards article{border:1px solid #ddd;padding:30px;border-radius:24px}footer{padding:30px 8%;background:#1D1D1D;color:white}`;
const sampleJS=`document.querySelectorAll('.btn').forEach(btn=>btn.addEventListener('click',()=>alert('Proposta solicitada!')));`;
function useSample(){htmlInput.value=sampleHTML;cssInput.value=sampleCSS;jsInput.value=sampleJS;refreshPreview()}function refreshPreview(){preview.srcdoc=`<!doctype html><html><head><style>${cssInput.value}</style></head><body>${htmlInput.value}<script>${jsInput.value.replaceAll('</script>','<\\/script>')}<\/script></body></html>`}
$('.tabs').onclick=e=>{if(!e.target.classList.contains('tab'))return;document.querySelectorAll('.tab,.editor').forEach(x=>x.classList.remove('active'));e.target.classList.add('active');$('#'+e.target.dataset.tab+'Input').classList.add('active')}
document.querySelectorAll('.option').forEach(o=>o.onclick=()=>{document.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));o.classList.add('selected');o.querySelector('input').checked=true});
async function readFile(input,area){const f=input.files[0];if(f) area.value=await f.text();refreshPreview()}htmlFile.onchange=()=>readFile(htmlFile,htmlInput);cssFile.onchange=()=>readFile(cssFile,cssInput);jsFile.onchange=()=>readFile(jsFile,jsInput);refreshBtn.onclick=refreshPreview;sampleBtn.onclick=useSample;
function analyze(html){const doc=new DOMParser().parseFromString(`<main>${html}</main>`,'text/html');const body=doc.body;const sections=[...body.querySelectorAll('header,nav,main,section,article,footer,aside')];const classes=[...new Set([...body.querySelectorAll('[class]')].flatMap(e=>[...e.classList]))];const scripts=(jsInput.value.match(/function|=>|addEventListener/g)||[]).length;const tags=[...body.querySelectorAll('*')].reduce((a,e)=>(a[e.tagName.toLowerCase()]=(a[e.tagName.toLowerCase()]||0)+1,a),{});return{sections,classes,scripts,tags,htmlNodes:body.querySelectorAll('*').length}}
function jsxify(html){return html.replace(/class=/g,'className=').replace(/for=/g,'htmlFor=').replace(/<!--/g,'{/*').replace(/-->/g,'*/}').replace(/<img([^>]*?)(?<!\/)>(?!<\/img>)/g,'<img$1 />')}
function componentName(el,i){let n=el.tagName.toLowerCase();let c=(el.className||'').toString().split(/\s+/)[0];let base=c||n||'section';return base.replace(/(^|[-_\s])(\w)/g,(_,a,b)=>b.toUpperCase()).replace(/[^A-Za-z0-9]/g,'')||`Section${i+1}`}
function compile(){const name=(projectName.value||'site-convertido').trim().replace(/[^a-zA-Z0-9-_]/g,'-').toLowerCase();const target=document.querySelector('input[name=target]:checked').value;const html=htmlInput.value,css=cssInput.value,js=jsInput.value;const meta=analyze(html);let files={};let report=`# Relatorio do Front Compiler AI\n\nEntrada analisada:\n- ${meta.htmlNodes} nos HTML\n- ${Object.keys(meta.tags).length} tipos de tags\n- ${meta.classes.length} classes CSS encontradas\n- ${meta.scripts} interacoes JS detectadas\n\nFases executadas:\n1. Analise lexica: leitura de tags, classes, ids, textos e scripts.\n2. Analise sintatica: montagem da arvore DOM.\n3. Analise semantica: deteccao de header, sections, articles e footer.\n4. Codigo intermediario: lista de componentes.\n5. Geracao de codigo: arquivos do projeto ${target}.\n`; if(target==='next') files=genNext(name,html,css,js,meta,report); if(target==='react') files=genReact(name,html,css,js,meta,report); if(target==='php') files=genPhp(name,html,css,js,meta,report); if(target==='clean') files=genClean(name,html,css,js,report); generated=files;renderFiles();downloadZip.disabled=false;copyAll.disabled=false;renderReport(meta,target);}
function genNext(name,html,css,js,meta,report){let files={};let imports=[], comps=[];if(splitComponents.checked&&meta.sections.length){meta.sections.forEach((el,i)=>{let cn=componentName(el,i);imports.push(`import ${cn} from '../components/${cn}';`);comps.push(`      <${cn} />`);files[`components/${cn}.jsx`]=`export default function ${cn}(){\n  return (\n    ${jsxify(el.outerHTML)}\n  );\n}\n`});}else comps=[`      <div dangerouslySetInnerHTML={{__html: html}} />`];files['app/page.jsx']=`${imports.join('\n')}\nimport './globals.css';\n\nexport default function Home(){\n  return (\n    <>\n${comps.join('\n')}\n    </>\n  );\n}\n`;files['app/globals.css']=css;files['app/client.js']=js;files['package.json']=JSON.stringify({scripts:{dev:'next dev',build:'next build',start:'next start'},dependencies:{next:'latest',react:'latest','react-dom':'latest'},devDependencies:{}},null,2);files['README.md']=`# ${name}\n\nProjeto gerado pelo Front Compiler AI.\n\n## Rodar\n\n\`npm install\`\n\`npm run dev\`\n`;files['docs/relatorio-compilador.md']=report;return files}
function genReact(name,html,css,js,meta,report){let files={};files['index.html']='<div id="root"></div><script type="module" src="/src/App.jsx"></script>';files['src/App.jsx']=`import './style.css';\nexport default function App(){return (<>${jsxify(html)}</>)}\n`;files['src/style.css']=css;files['src/main.js']=js;files['package.json']=JSON.stringify({scripts:{dev:'vite',build:'vite build'},dependencies:{'@vitejs/plugin-react':'latest',vite:'latest',react:'latest','react-dom':'latest'}},null,2);files['README.md']=`# ${name}\nReact + Vite gerado pelo Front Compiler AI.`;files['docs/relatorio-compilador.md']=report;return files}
function genPhp(name,html,css,js,meta,report){let header='',footer='',content=html;const h=html.match(/<header[\s\S]*?<\/header>/i);const f=html.match(/<footer[\s\S]*?<\/footer>/i);if(h){header=h[0];content=content.replace(h[0],'<?php include "includes/header.php"; ?>')}if(f){footer=f[0];content=content.replace(f[0],'<?php include "includes/footer.php"; ?>')}return{'index.php':`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="assets/style.css"><title>${name}</title></head><body>\n${content}\n<script src="assets/app.js"></script></body></html>`, 'includes/header.php':header||'<!-- header nao detectado -->','includes/footer.php':footer||'<!-- footer nao detectado -->','assets/style.css':css,'assets/app.js':js,'README.md':`# ${name}\nProjeto PHP front-end gerado pelo Front Compiler AI.`, 'docs/relatorio-compilador.md':report}}
function genClean(name,html,css,js,report){return{'index.html':`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="assets/style.css"><title>${name}</title></head><body>${html}<script src="assets/app.js"></script></body></html>`,'assets/style.css':css,'assets/app.js':js,'README.md':`# ${name}\nHTML limpo gerado pelo Front Compiler AI.`, 'docs/relatorio-compilador.md':report}}
function renderFiles(){fileSelect.innerHTML='';let tree='';Object.keys(generated).sort().forEach(p=>{tree+=`📄 ${p}\n`;let op=document.createElement('option');op.value=p;op.textContent=p;fileSelect.appendChild(op)});fileTree.textContent=tree;showFile()}function showFile(){let p=fileSelect.value;codeOutput.textContent=generated[p]||''}fileSelect.onchange=showFile;copyAll.onclick=()=>navigator.clipboard.writeText(generated[fileSelect.value]||'');compileBtn.onclick=compile;
function renderReport(meta,target){report.innerHTML=`<div class="report-grid"><div class="metric"><b>${meta.htmlNodes}</b>nos HTML</div><div class="metric"><b>${meta.classes.length}</b>classes CSS</div><div class="metric"><b>${target.toUpperCase()}</b>destino</div></div><p>O projeto foi compilado com deteccao de componentes, geracao de arquivos e relatorio tecnico. Ao baixar o ZIP, os arquivos aparecem normalmente no VS Code.</p>`}
function crc32Bytes(bytes){
  let table=crc32Bytes.table||(crc32Bytes.table=Array.from({length:256},(_,n)=>{
    let c=n;
    for(let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
    return c>>>0;
  }));
  let crc=0xffffffff;
  for(const b of bytes) crc=(crc>>>8)^table[(crc^b)&255];
  return (crc^0xffffffff)>>>0;
}
function le16(n){return [n&255,(n>>>8)&255]}
function le32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
function concatUint8(parts){
  const total=parts.reduce((sum,p)=>sum+p.length,0);
  const out=new Uint8Array(total);
  let offset=0;
  for(const p of parts){out.set(p,offset);offset+=p.length;}
  return out;
}
function bytesFrom(arr){return new Uint8Array(arr)}
function zip(files){
  const enc=new TextEncoder();
  const localParts=[];
  const centralParts=[];
  let offset=0;
  const entries=Object.entries(files);
  for(const [name,content] of entries){
    const data=enc.encode(String(content));
    const fn=enc.encode(name.replace(/^\/+/,''));
    const crc=crc32Bytes(data);
    const localHeader=bytesFrom([
      0x50,0x4b,0x03,0x04, ...le16(20), ...le16(0), ...le16(0), ...le16(0), ...le16(0),
      ...le32(crc), ...le32(data.length), ...le32(data.length), ...le16(fn.length), ...le16(0)
    ]);
    localParts.push(localHeader,fn,data);
    const centralHeader=bytesFrom([
      0x50,0x4b,0x01,0x02, ...le16(20), ...le16(20), ...le16(0), ...le16(0), ...le16(0), ...le16(0),
      ...le32(crc), ...le32(data.length), ...le32(data.length), ...le16(fn.length), ...le16(0), ...le16(0),
      ...le16(0), ...le16(0), ...le32(0), ...le32(offset)
    ]);
    centralParts.push(centralHeader,fn);
    offset+=localHeader.length+fn.length+data.length;
  }
  const local=concatUint8(localParts);
  const central=concatUint8(centralParts);
  const end=bytesFrom([
    0x50,0x4b,0x05,0x06, ...le16(0), ...le16(0), ...le16(entries.length), ...le16(entries.length),
    ...le32(central.length), ...le32(local.length), ...le16(0)
  ]);
  return new Blob([local,central,end],{type:'application/zip'});
}
downloadZip.onclick=()=>{let blob=zip(generated),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(projectName.value||'site-convertido')+'.zip';a.click();URL.revokeObjectURL(a.href)};
useSample();
