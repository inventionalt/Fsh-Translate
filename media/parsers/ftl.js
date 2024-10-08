function fromObjecrWithPrefix(obj, prefix) {
  return Object.keys(obj)
    .filter(k => k.length>0)
    .map(k => {
      if (typeof obj[k] === 'string') {
        return `${prefix}-${k} = ${obj[k]}`;
      } else {
        return fromObjectWithPrefix(obj[k], prefix+'-'+k)
      }
    }).join('\n');
}

export function fromObject(obj) {
  return Object.keys(obj)
    .filter(k => k.length>0)
    .map(k => {
      if (typeof obj[k] === 'string') {
        return `${k} = ${obj[k]}`;
      } else {
        return fromObjectWithPrefix(obj[k], k)
      }
    }).join('\n');
}

export function toObject(ftl) {
  let obj = {};
  ftl = ftl
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length>1)
    .forEach(l => {
      let p = l.split(' = ');
      let k = p[0].split('-');
      p = p.slice(1,p.length).join(' = ');
      let t = obj;
      for (let i = 0; i<k.length; i++) {
        if (i==k.length-1) {
          t[k[i]] = p;
        } else {
          if (!t[k[i]]) t[k[i]] = {};
          t = t[k[i]];
        }
      }
    });
  return obj;
}
