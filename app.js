const $=s=>document.querySelector(s);let generated={};

const sampleHTML=`<header class="topbar"><a class="logo">Make+</a><nav><a>Inicio</a><a>Servicos</a><a>Contato</a></nav></header>
<section class="hero"><div><h1>Sites premium com performance</h1><p>Criamos landing pages, lojas e interfaces modernas.</p><a class="btn">Solicitar proposta</a></div></section>
<section class="cards"><article><h2>Design</h2><p>Layouts elegantes.</p></article><article><h2>SEO</h2><p>Estrutura otimizada.</p></article></section>
<footer><p>© 2026 Make+</p></footer>`;
const sampleCSS=`body{margin:0;font-family:Montserrat,Arial,sans-serif;color:#1D1D1D}.topbar{display:flex;justify-content:space-between;padding:28px 8%;background:#1D1D1D;color:white}.topbar a{margin:0 12px;color:inherit;text-decoration:none}.logo{color:#FC4C13!important;font-weight:800}.hero{min-height:70vh;display:grid;place-items:center;padding:8%;background:#f5f5f5}.hero h1{font-size:64px;max-width:760px}.btn{display:inline-block;background:#FC4C13;color:white;padding:16px 22px;border-radius:999px}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;padding:8%}.cards article{border:1px solid #ddd;padding:30px;border-radius:24px}footer{padding:30px 8%;background:#1D1D1D;color:white}`;
const sampleJS=`document.querySelectorAll('.btn').forEach(btn=>btn.addEventListener('click',()=>alert('Proposta solicitada!')));`;

function useSample(){htmlInput.value=sampleHTML;cssInput.value=sampleCSS;jsInput.value=sampleJS;refreshPreview()}
function refreshPreview(){preview.srcdoc=`<!doctype html><html><head><style>${cssInput.value}</style></head><body>${htmlInput.value}<script>${jsInput.value.replaceAll('</script>','<\\/script>')}<\/script></body></html>`}

$('.tabs').onclick=e=>{if(!e.target.classList.contains('tab'))return;document.querySelectorAll('.tab,.editor').forEach(x=>x.classList.remove('active'));e.target.classList.add('active');$('#'+e.target.dataset.tab+'Input').classList.add('active')}
document.querySelectorAll('.option').forEach(o=>o.onclick=()=>{document.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));o.classList.add('selected');o.querySelector('input').checked=true});

async function readFile(input,area){const f=input.files[0];if(f) area.value=await f.text();refreshPreview()}
htmlFile.onchange=()=>readFile(htmlFile,htmlInput);
cssFile.onchange=()=>readFile(cssFile,cssInput);
jsFile.onchange=()=>readFile(jsFile,jsInput);
refreshBtn.onclick=refreshPreview;
sampleBtn.onclick=useSample;

// ─── ANÁLISE ────────────────────────────────────────────────────────────────
function analyze(html){
  const doc=new DOMParser().parseFromString(`<main>${html}</main>`,'text/html');
  const body=doc.body;
  const sections=[...body.querySelectorAll('header,nav,main,section,article,footer,aside')];
  const classes=[...new Set([...body.querySelectorAll('[class]')].flatMap(e=>[...e.classList]))];
  const scripts=(jsInput.value.match(/function|=>|addEventListener/g)||[]).length;
  const tags=[...body.querySelectorAll('*')].reduce((a,e)=>(a[e.tagName.toLowerCase()]=(a[e.tagName.toLowerCase()]||0)+1,a),{});
  return{sections,classes,scripts,tags,htmlNodes:body.querySelectorAll('*').length}
}

// ─── JSX CONVERTER (CORRIGIDO) ───────────────────────────────────────────────
// Converte HTML string para JSX válido
function jsxify(html){
  return html
    // Atributos HTML → JSX
    .replace(/\bclass=/g,'className=')
    .replace(/\bfor=/g,'htmlFor=')
    .replace(/\btabindex=/g,'tabIndex=')
    .replace(/\bstroke-width=/g,'strokeWidth=')
    .replace(/\bfill-rule=/g,'fillRule=')
    .replace(/\bclip-rule=/g,'clipRule=')
    .replace(/\bcontent-editable=/g,'contentEditable=')
    .replace(/\bcross-origin=/g,'crossOrigin=')
    .replace(/\ballow-full-screen=/g,'allowFullScreen=')
    // style="..." → style={{...}} — converte inline styles para objeto JS
    .replace(/style="([^"]*)"/g,(_,s)=>{
      const obj=s.split(';').filter(Boolean).map(r=>{
        const [k,...vs]=r.split(':');
        const key=k.trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
        const val=vs.join(':').trim();
        return `${key}:'${val}'`;
      }).join(', ');
      return `style={{${obj}}}`;
    })
    // Comentários HTML → comentários JSX
    .replace(/<!--([\s\S]*?)-->/g,'{/*$1*/}')
    // Tags void sem fechamento → auto-fechadas
    .replace(/<(img|input|br|hr|meta|link|area|base|col|embed|param|source|track|wbr)(\s[^>]*)?>(?!<\/\1>)/gi,'<$1$2 />')
    // Eventos inline (onclick → onClick, etc.)
    .replace(/\bon([a-z]+)=/g,(_,ev)=>`on${ev[0].toUpperCase()+ev.slice(1)}=`)
    // Aspas nos atributos: manter como string JSX
    ;
}

// ─── NOME DE COMPONENTE (SEM DUPLICATAS) ─────────────────────────────────────
function componentName(el, i, usedNames){
  const tag=el.tagName.toLowerCase();
  const cls=(el.className||'').toString().trim().split(/\s+/)[0]||'';
  // Prefere classe, senão tag
  let base=(cls||tag)
    .replace(/(^|[-_\s])(\w)/g,(_,a,b)=>b.toUpperCase())
    .replace(/[^A-Za-z0-9]/g,'')
    ||`Section${i+1}`;
  // Garante que o nome começa com maiúscula
  base=base[0].toUpperCase()+base.slice(1);
  // Resolve duplicatas adicionando sufixo numérico
  let name=base, n=2;
  while(usedNames.has(name)) name=`${base}${n++}`;
  usedNames.add(name);
  return name;
}

// ─── COMPILE ─────────────────────────────────────────────────────────────────
function compile(){
  const name=(projectName.value||'site-convertido').trim().replace(/[^a-zA-Z0-9-_]/g,'-').toLowerCase();
  const target=document.querySelector('input[name=target]:checked').value;
  const html=htmlInput.value, css=cssInput.value, js=jsInput.value;
  const meta=analyze(html);
  let files={};
  let report=`# Relatorio do Front Compiler AI\n\nEntrada analisada:\n- ${meta.htmlNodes} nos HTML\n- ${Object.keys(meta.tags).length} tipos de tags\n- ${meta.classes.length} classes CSS encontradas\n- ${meta.scripts} interacoes JS detectadas\n\nFases executadas:\n1. Analise lexica: leitura de tags, classes, ids, textos e scripts.\n2. Analise sintatica: montagem da arvore DOM.\n3. Analise semantica: deteccao de header, sections, articles e footer.\n4. Codigo intermediario: lista de componentes.\n5. Geracao de codigo: arquivos do projeto ${target}.\n`;
  if(target==='next')  files=genNext(name,html,css,js,meta,report);
  if(target==='react') files=genReact(name,html,css,js,meta,report);
  if(target==='php')   files=genPhp(name,html,css,js,meta,report);
  if(target==='wordpress') files=genWordPress(name,html,css,js,meta,report);
  if(target==='clean') files=genClean(name,html,css,js,report);
  generated=files;
  renderFiles();
  downloadZip.disabled=false;
  copyAll.disabled=false;
  renderReport(meta,target);
}

// ─── GERADOR NEXT.JS (CORRIGIDO) ─────────────────────────────────────────────
function genNext(name,html,css,js,meta,report){
  const files={};
  const usedNames=new Set();
  const imports=[], comps=[];

  if(splitComponents.checked && meta.sections.length){
    meta.sections.forEach((el,i)=>{
      const cn=componentName(el,i,usedNames);
      imports.push(`import ${cn} from '../components/${cn}';`);
      comps.push(`      <${cn} />`);

      // Indenta o JSX do componente corretamente
      const jsxContent=indentJsx(jsxify(el.outerHTML));
      files[`components/${cn}.jsx`]=
`export default function ${cn}() {
  return (
    ${jsxContent}
  );
}
`;
    });
  } else {
    // Modo sem separação: monta um único componente limpo com o HTML todo
    const jsxContent=indentJsx(jsxify(html));
    const cn='PageContent';
    imports.push(`import ${cn} from '../components/${cn}';`);
    comps.push(`      <${cn} />`);
    files[`components/${cn}.jsx`]=
`export default function ${cn}() {
  return (
    <>
      ${jsxContent}
    </>
  );
}
`;
  }

  // app/layout.jsx — OBRIGATÓRIO no Next.js App Router, estava faltando
  files['app/layout.jsx']=
`import './globals.css';

export const metadata = {
  title: '${name}',
  description: 'Projeto gerado pelo Front Compiler.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
`;

  // app/page.jsx — sem importar globals.css aqui (já está no layout)
  files['app/page.jsx']=
`${imports.join('\n')}

export default function Home() {
  return (
    <>
${comps.join('\n')}
    </>
  );
}
`;

  files['app/globals.css']=css;

  // JS do cliente como componente client-side
  if(js && js.trim()){
    files['app/ClientScripts.jsx']=
`'use client';
import { useEffect } from 'react';

export default function ClientScripts() {
  useEffect(() => {
${js.split('\n').map(l=>'    '+l).join('\n')}
  }, []);
  return null;
}
`;
    // Adiciona ao page.jsx o import do script
    files['app/page.jsx']=
`${imports.join('\n')}
import ClientScripts from './ClientScripts';

export default function Home() {
  return (
    <>
${comps.join('\n')}
      <ClientScripts />
    </>
  );
}
`;
  }

  files['package.json']=JSON.stringify({
    name,
    version:'0.1.0',
    private:true,
    scripts:{dev:'next dev',build:'next build',start:'next start'},
    dependencies:{next:'14.2.0',react:'^18','react-dom':'^18'},
    devDependencies:{}
  },null,2);

  files['README.md']=
`# ${name}

Projeto Next.js gerado pelo Front Compiler.

## Como rodar

\`\`\`bash
npm install
npm run dev
\`\`\`

Abra http://localhost:3000

## Estrutura

- \`app/layout.jsx\` — Root layout com metadados e CSS global
- \`app/page.jsx\` — Página principal
- \`app/globals.css\` — Estilos globais
- \`components/\` — Componentes detectados automaticamente
`;

  files['docs/relatorio-compilador.md']=report;
  return files;
}

// ─── GERADOR REACT + VITE (CORRIGIDO) ────────────────────────────────────────
function genReact(name,html,css,js,meta,report){
  const files={};
  const usedNames=new Set();
  const imports=[], comps=[];

  if(splitComponents.checked && meta.sections.length){
    meta.sections.forEach((el,i)=>{
      const cn=componentName(el,i,usedNames);
      imports.push(`import ${cn} from './components/${cn}';`);
      comps.push(`      <${cn} />`);
      const jsxContent=indentJsx(jsxify(el.outerHTML));
      files[`src/components/${cn}.jsx`]=
`export default function ${cn}() {
  return (
    ${jsxContent}
  );
}
`;
    });
  } else {
    const jsxContent=indentJsx(jsxify(html));
    comps.push(`      <>${jsxContent}</>`);
  }

  files['src/App.jsx']=
`import './style.css';
${imports.join('\n')}

export default function App() {
  return (
    <>
${comps.join('\n')}
    </>
  );
}
`;

  files['src/main.jsx']=
`import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

  files['index.html']=
`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

  files['src/style.css']=css;
  if(js && js.trim()) files['src/main.js']=js;

  files['vite.config.js']=
`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

  files['package.json']=JSON.stringify({
    name,version:'0.1.0',private:true,
    scripts:{dev:'vite',build:'vite build',preview:'vite preview'},
    dependencies:{react:'^18','react-dom':'^18'},
    devDependencies:{'@vitejs/plugin-react':'^4','vite':'^5'}
  },null,2);

  files['README.md']=`# ${name}\n\nReact + Vite gerado pelo Front Compiler.\n\n## Rodar\n\n\`npm install\`\n\`npm run dev\`\n`;
  files['docs/relatorio-compilador.md']=report;
  return files;
}

// ─── GERADOR PHP (sem alteração significativa, já funcionava) ─────────────────
function genPhp(name,html,css,js,meta,report){
  let header='',footer='',content=html;
  const h=html.match(/<header[\s\S]*?<\/header>/i);
  const f=html.match(/<footer[\s\S]*?<\/footer>/i);
  if(h){header=h[0];content=content.replace(h[0],'<?php include "includes/header.php"; ?>')}
  if(f){footer=f[0];content=content.replace(f[0],'<?php include "includes/footer.php"; ?>')}
  return{
    'index.php':`<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <link rel="stylesheet" href="assets/style.css">\n  <title>${name}</title>\n</head>\n<body>\n${content}\n<script src="assets/app.js"></script>\n</body>\n</html>`,
    'includes/header.php':header||'<!-- header nao detectado -->',
    'includes/footer.php':footer||'<!-- footer nao detectado -->',
    'assets/style.css':css,
    'assets/app.js':js||'',
    'README.md':`# ${name}\nProjeto PHP front-end gerado pelo Front Compiler.`,
    'docs/relatorio-compilador.md':report
  };
}

// ─── GERADOR HTML LIMPO (sem alteração) ──────────────────────────────────────
function genClean(name,html,css,js,report){
  return{
    'index.html':`<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <link rel="stylesheet" href="assets/style.css">\n  <title>${name}</title>\n</head>\n<body>\n${html}\n<script src="assets/app.js"></script>\n</body>\n</html>`,
    'assets/style.css':css,
    'assets/app.js':js||'',
    'README.md':`# ${name}\nHTML limpo gerado pelo Front Compiler.`,
    'docs/relatorio-compilador.md':report
  };
}

// ─── GERADOR WORDPRESS ────────────────────────────────────────────────────────
// Gera um tema WordPress instalável via WP Admin → Aparência → Temas → Enviar
// O ZIP deve conter a pasta do tema diretamente (ex: nome-do-tema/style.css)
// NÃO usar via "Import site" do Local WP — isso é para exportações do próprio Local.
// Fluxo correto: criar site no Local WP → instalar tema via WP Admin → importar SQL.
function genWordPress(name,html,css,js,meta,report){
  const files={};
  const slug=name.replace(/[^a-z0-9-]/g,'-');
  // Prefixo do tema: todos arquivos ficam dentro de slug/ para que o ZIP seja
  // instalável em Aparência → Temas → Enviar arquivo ZIP
  const T=slug+'/';

  // ── Detecta regiões semânticas ──────────────────────────────────────────────
  const doc=new DOMParser().parseFromString(`<body>${html}</body>`,'text/html');
  const headerEl=doc.querySelector('header');
  const footerEl=doc.querySelector('footer');
  const navEl=doc.querySelector('nav');

  const headerHtml=headerEl
    ? headerEl.outerHTML
    : (navEl ? navEl.outerHTML : '<!-- sem header detectado -->');
  const footerHtml=footerEl ? footerEl.outerHTML : '<!-- sem footer detectado -->';

  let bodyHtml=html;
  if(headerEl) bodyHtml=bodyHtml.replace(headerEl.outerHTML,'');
  if(footerEl) bodyHtml=bodyHtml.replace(footerEl.outerHTML,'');
  bodyHtml=bodyHtml.trim();

  const siteTitle=name.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const fn=slug.replace(/-/g,'_'); // nome de função PHP seguro

  // ── style.css — cabeçalho obrigatório do tema ────────────────────────────────
  files[T+'style.css']=
`/*
Theme Name: ${siteTitle}
Description: Tema gerado automaticamente pelo Front Compiler a partir de HTML/CSS/JS.
Version: 1.0.0
Author: Front Compiler
License: GNU General Public License v2 or later
Text Domain: ${slug}
*/

${css}
`;

  // ── functions.php ────────────────────────────────────────────────────────────
  files[T+'functions.php']=
`<?php
function ${fn}_enqueue() {
    wp_enqueue_style( '${slug}-style', get_stylesheet_uri(), array(), '1.0.0' );
${js && js.trim() ? `    wp_enqueue_script( '${slug}-script', get_template_directory_uri() . '/assets/main.js', array(), '1.0.0', true );` : ''}
}
add_action( 'wp_enqueue_scripts', '${fn}_enqueue' );

function ${fn}_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ) );
    register_nav_menus( array( 'primary' => __( 'Menu Principal', '${slug}' ) ) );
}
add_action( 'after_setup_theme', '${fn}_setup' );
?>
`;

  // ── header.php ───────────────────────────────────────────────────────────────
  files[T+'header.php']=
`<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
${headerHtml}
`;

  // ── footer.php ───────────────────────────────────────────────────────────────
  files[T+'footer.php']=
`${footerHtml}
<?php wp_footer(); ?>
</body>
</html>
`;

  // ── index.php ────────────────────────────────────────────────────────────────
  files[T+'index.php']=
`<?php get_header(); ?>
<main id="main-content">
  <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
    <div class="wp-entry"><?php the_content(); ?></div>
  <?php endwhile; else : ?>
${bodyHtml.split('\n').map(l=>'    '+l).join('\n')}
  <?php endif; ?>
</main>
<?php get_footer(); ?>
`;

  // ── front-page.php — home estática com o HTML convertido ────────────────────
  files[T+'front-page.php']=
`<?php get_header(); ?>
${bodyHtml.split('\n').map(l=>'  '+l).join('\n')}
<?php get_footer(); ?>
`;

  // ── page.php ─────────────────────────────────────────────────────────────────
  files[T+'page.php']=
`<?php get_header(); ?>
<main id="main-content">
  <?php while ( have_posts() ) : the_post(); ?>
    <article id="page-<?php the_ID(); ?>"><?php the_content(); ?></article>
  <?php endwhile; ?>
</main>
<?php get_footer(); ?>
`;

  if(js && js.trim()) files[T+'assets/main.js']=js;

  // ── SQL para importar via WP-CLI ou phpMyAdmin ───────────────────────────────
  const now=new Date().toISOString().replace('T',' ').split('.')[0];
  const escaped=bodyHtml.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n');

  files[slug+'.sql']=
`-- SQL gerado pelo Front Compiler
-- Como usar: no WP Admin vá em Ferramentas > Importar, ou via WP-CLI:
--   wp db import ${slug}.sql
-- Isso cria a página "Home" com o conteúdo do seu site.

SET NAMES utf8mb4;
INSERT INTO \`wp_posts\`
  (\`post_author\`,\`post_date\`,\`post_date_gmt\`,\`post_content\`,\`post_title\`,\`post_excerpt\`,\`post_status\`,\`comment_status\`,\`ping_status\`,\`post_name\`,\`to_ping\`,\`pinged\`,\`post_modified\`,\`post_modified_gmt\`,\`post_content_filtered\`,\`post_parent\`,\`menu_order\`,\`post_type\`,\`post_mime_type\`,\`comment_count\`)
VALUES
  (1,'${now}','${now}','${escaped}','Home','','publish','closed','closed','home','','','${now}','${now}','',0,0,'page','',0);

-- Após importar, defina essa página como home:
-- WP Admin → Configurações → Leitura → Uma página estática → Home
`;

  // ── README com fluxo correto ──────────────────────────────────────────────────
  files['README.md']=
`# ${siteTitle} — Tema WordPress

Gerado pelo Front Compiler.

## ⚠️ Como instalar (fluxo correto)

**NÃO arraste este ZIP no Local WP** — ele não é um export do Local, é um tema.

### Passo a passo

1. Abra o **Local WP** e crie um novo site WordPress normal
2. Clique em **WP Admin** para abrir o painel
3. Vá em **Aparência → Temas → Adicionar novo → Enviar tema**
4. Selecione o arquivo \`${slug}.zip\` e clique em **Instalar agora**
5. Clique em **Ativar**
6. Para importar a página Home, vá em **Ferramentas → Importar** ou use WP-CLI:
   \`\`\`bash
   wp db import ${slug}.sql
   \`\`\`
7. Vá em **Configurações → Leitura** e defina "Uma página estática" → **Home**

## Estrutura do tema

\`\`\`
${slug}/
  style.css        ← identidade do tema + CSS original
  functions.php    ← enqueue de estilos e scripts
  header.php       ← cabeçalho detectado do HTML
  footer.php       ← rodapé detectado
  index.php        ← template padrão
  front-page.php   ← home com HTML convertido
  page.php         ← template para páginas
  assets/
    main.js        ← JavaScript (se houver)

${slug}.sql        ← insere a página Home no banco
README.md          ← este arquivo
\`\`\`
`;

  files['docs/relatorio-compilador.md']=report;
  return files;
}

  files['docs/relatorio-compilador.md']=report;
  return files;
}

// ─── HELPER: INDENTAÇÃO DE JSX ────────────────────────────────────────────────
// Garante que JSX multi-linha fique indentado corretamente dentro do return()
function indentJsx(jsx){
  const lines=jsx.split('\n');
  if(lines.length<=1) return jsx;
  return lines.map((l,i)=>i===0?l:'    '+l).join('\n');
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function renderFiles(){
  fileSelect.innerHTML='';
  let tree='';
  Object.keys(generated).sort().forEach(p=>{
    tree+=`📄 ${p}\n`;
    let op=document.createElement('option');
    op.value=p;op.textContent=p;
    fileSelect.appendChild(op);
  });
  fileTree.textContent=tree;
  showFile();
}
function showFile(){let p=fileSelect.value;codeOutput.textContent=generated[p]||''}
fileSelect.onchange=showFile;
copyAll.onclick=()=>navigator.clipboard.writeText(generated[fileSelect.value]||'');
compileBtn.onclick=compile;

function renderReport(meta,target){
  report.innerHTML=`<div class="report-grid"><div class="metric"><b>${meta.htmlNodes}</b>nos HTML</div><div class="metric"><b>${meta.classes.length}</b>classes CSS</div><div class="metric"><b>${target.toUpperCase()}</b>destino</div></div><p>O projeto foi compilado com deteccao de componentes, geracao de arquivos e relatorio tecnico. Ao baixar o ZIP, os arquivos aparecem normalmente no VS Code.</p>`;
}

// ─── ZIP (sem alteração, já funcionava) ──────────────────────────────────────
function crc32Bytes(bytes){
  let table=crc32Bytes.table||(crc32Bytes.table=Array.from({length:256},(_,n)=>{
    let c=n;for(let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);return c>>>0;
  }));
  let crc=0xffffffff;
  for(const b of bytes) crc=(crc>>>8)^table[(crc^b)&255];
  return (crc^0xffffffff)>>>0;
}
function le16(n){return [n&255,(n>>>8)&255]}
function le32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
function concatUint8(parts){
  const total=parts.reduce((sum,p)=>sum+p.length,0);
  const out=new Uint8Array(total);let offset=0;
  for(const p of parts){out.set(p,offset);offset+=p.length;}
  return out;
}
function bytesFrom(arr){return new Uint8Array(arr)}
function zip(files){
  const enc=new TextEncoder();
  const localParts=[];const centralParts=[];let offset=0;
  const entries=Object.entries(files);
  for(const [name,content] of entries){
    const data=enc.encode(String(content));
    const fn=enc.encode(name.replace(/^\/+/,''));
    const crc=crc32Bytes(data);
    const localHeader=bytesFrom([
      0x50,0x4b,0x03,0x04,...le16(20),...le16(0),...le16(0),...le16(0),...le16(0),
      ...le32(crc),...le32(data.length),...le32(data.length),...le16(fn.length),...le16(0)
    ]);
    localParts.push(localHeader,fn,data);
    const centralHeader=bytesFrom([
      0x50,0x4b,0x01,0x02,...le16(20),...le16(20),...le16(0),...le16(0),...le16(0),...le16(0),
      ...le32(crc),...le32(data.length),...le32(data.length),...le16(fn.length),...le16(0),...le16(0),
      ...le16(0),...le16(0),...le32(0),...le32(offset)
    ]);
    centralParts.push(centralHeader,fn);
    offset+=localHeader.length+fn.length+data.length;
  }
  const local=concatUint8(localParts);
  const central=concatUint8(centralParts);
  const end=bytesFrom([
    0x50,0x4b,0x05,0x06,...le16(0),...le16(0),...le16(entries.length),...le16(entries.length),
    ...le32(central.length),...le32(local.length),...le16(0)
  ]);
  return new Blob([local,central,end],{type:'application/zip'});
}
downloadZip.onclick=()=>{
  let blob=zip(generated),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=(projectName.value||'site-convertido')+'.zip';
  a.click();
  URL.revokeObjectURL(a.href);
};

useSample();