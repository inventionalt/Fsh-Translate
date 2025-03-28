// Imports
import * as ftl from '/media/parsers/ftl.js'
import * as csv from '/media/parsers/csv.js'
import * as yaml from '/media/parsers/yaml.js'

// On window load do some stuff
document.addEventListener("DOMContentLoaded", () => {
  Split(['.side', '.panel'], {
    sizes: [25, 75]
  });
  tippy('#nav-file-button', {
    content: `<button onclick="openModal('file-load')">Load</button><button onclick="openModal('file-save')">Save</button>`,
    trigger: 'click',
    placement: 'bottom',
    arrow: false,
    interactive: true,
    allowHTML: true
  });
  tippy('#nav-editor-button', {
    content: `<button onclick="main=prompt('Main language code', main??'en');side()">Set main language</button><button onclick="normalizeCodes()">Iso code normalize</button><hr style="width:80%"><button onclick="Array.from(document.querySelectorAll('details')).forEach(e=>e.open=true)">Expand tree</button><button onclick="Array.from(document.querySelectorAll('details')).forEach(e=>e.open=false)">Shrink tree</button>`,
    trigger: 'click',
    placement: 'bottom',
    arrow: false,
    interactive: true,
    allowHTML: true
  });
});

// Utility functions
function parse(con, type, name) {
  try {
    if (type === 'json') return JSON.parse(con);
    if (type === 'ftl') return ftl.toObject(con);
    if (type === 'csv') return csv.toObject(con);
    if (type === 'yaml') return yaml.toObject(con);
    return {};
  } catch(err) {
    alert(`Could not parse ${name}`)
    return {};
  }
}
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      resolve(evt.target.result);
    };
    reader.onerror = (evt) => {
      reject('Could not read')
    };
    reader.readAsText(file);
  });
}
function deleteCurrentLang() {
  let current = document.getElementById('lang-select').value;
  if (confirm('Are you sure you want to delete '+current)) {
    delete data[current];
    side();
  }
}
function addLang() {
  let code = prompt('Code of new language');
  if (!code) return;
  data[code] = {};
  side();
  document.getElementById('lang-select').value = code;
}
function normalizeCodes() {
  let obj = {};
  let orig = structuredClone(data);
  Object.keys(orig).forEach(l => {
    let conversion = l.replace('_','-').split('-').slice(0,2);
    conversion[0] = conversion[0].toLowerCase().slice(0,3);
    if (conversion[1]) conversion[1] = conversion[1].toUpperCase().slice(0,3);
    obj[conversion.join('-')] = orig[l];
    data = obj;
    side();
  })
}
window.normalizeCodes = normalizeCodes;
function getStringForLang(lang, prefix) {
  let path = data[lang];
  prefix.split('.').forEach(pre => path=(path[pre]??''));
  return path ?? '';
}
function setStringForLang(lang, val, prefix) { 
  let path = data[lang];
  const keys = prefix.split('.');
  keys.forEach((pre, index)=>{
    if (index === keys.length - 1) {
      path[pre] = val;
    } else {
      if (!path[pre]) path[pre] = {};
      path = path[pre];
    }
  });
}
window.setStringForLang = setStringForLang;
function loadPanelFor(id) {
  let cur = document.getElementById('lang-select').value;
  document.querySelector('.panel').innerHTML = `<h2>${id.replaceAll('.',' > ')}</h2>
<p>${getStringForLang(data[main]?main:Object.keys(data)[0], id)}</p>
<hr>
<textarea id="editor" class="editor" onkeyup="setStringForLang('${cur}', this.value, '${id}')">${getStringForLang(cur, id)}</textarea>`;
}
window.loadPanelFor = loadPanelFor;
function ObjectToTree(obj, prefix) {
  return Object.keys(obj).map(k=>(typeof obj[k])==='string'?`<button onclick="loadPanelFor('${(prefix.length?prefix+'.':'')+k}')">${k}</button>`:`<details id="d-${(prefix.length?prefix+'.':'')+k}"${document.getElementById(`d-${(prefix.length?prefix+'.':'')+k}`)?.getAttribute('open')==null?'':' open'}><summary>${k}</summary>${ObjectToTree(obj[k], (prefix.length?prefix+'.':'')+k)}</details>`).join('')
}
function side() {
  const ls = document.getElementById('lang-select');
  let before = ls.value ?? '';
  ls.innerHTML = Object.keys(data).map(l=>`<option value="${l}"${before===l?' selected':''}>${l}${main==l?' (main)':''}</option>`).sort().join('');
  document.getElementById('tree').innerHTML = ObjectToTree(data[main]??(data[Object.keys(data)[0]]??{}), '');
}
window.side = side;
function download(url, name) {
  let link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  link.remove();
}

// File load
var main;
var data = {};
window.main = main;
window.data = data;
document.getElementById('file-load-button').addEventListener('click', ()=>{
  let files = document.getElementById('file').files;
  let type = document.getElementById('type-load').value;
  main ??= prompt('Main language code', 'en') ?? 'en';
  if (type === 'json-o') {
    for (let i = 0; i<files.length; i++) {
      readFile(files[i]).then(content => {
        let code = prompt('Code for: '+files[i].name, files[i].name.split('.')[0]);
        data[code] = parse(content, 'json', files[i].name);
        side();
      })
    }
  } else if (type === 'json-m') {
    readFile(files[0]).then(content => {
      let parsed = parse(content, 'json', files[0].name);
      Object.keys(parsed).forEach(l => {
        data[l] = parsed[l];
        side();
      })
    })
  } else if (type === 'ftl') {
    for (let i = 0; i<files.length; i++) {
      readFile(files[i]).then(content => {
        let code = prompt('Code for: '+files[i].name, files[i].name.split('.')[0]);
        data[code] = parse(content, 'ftl', files[i].name);
        side();
      })
    }
  } else if (type === 'csv') {
    readFile(files[0]).then(content => {
      let parsed = parse(content, 'csv', files[0].name);
      Object.keys(parsed).forEach(l => {
        data[l] = parsed[l];
        side();
      })
    })
  }
}, false)

// File save
document.getElementById('file-save-button').addEventListener('click', ()=>{
  let type = document.getElementById('type-save').value;
  if (type === 'json-o') {
    let zip = new JSZip();
    Object.keys(data).forEach(lang => {
      zip.file(lang+'.json', JSON.stringify(data[lang], null, 2))
    })
    zip.generateAsync({ type: "blob" })
      .then(content => {
        download(URL.createObjectURL(content), 'translations.zip');
      });
  } else if (type === 'json-m') {
    download(URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)])), 'translations.json');
  } else if (type === 'ftl') {
    let zip = new JSZip();
    Object.keys(data).forEach(lang => {
      zip.file(lang+'.json', ftl.fromObject(data[lang]))
    })
    zip.generateAsync({ type: "blob" })
      .then(content => {
        download(URL.createObjectURL(content), 'translations.zip');
      });
  } else if (type === 'yaml-o') {
    let zip = new JSZip();
    Object.keys(data).forEach(lang => {
      zip.file(lang+'.yaml', yaml.fromObject(data[lang]))
    })
    zip.generateAsync({ type: "blob" })
      .then(content => {
        download(URL.createObjectURL(content), 'translations.zip');
      });
  } else if (type === 'yaml-m') {
    download(URL.createObjectURL(new Blob([yaml.fromObject(data)])), 'translations.yaml');
  }
}, false)

// Lang add/remove
document.getElementById('lang-add').addEventListener('click', ()=>{addLang()})
document.getElementById('lang-remove').addEventListener('click', ()=>{deleteCurrentLang()})
