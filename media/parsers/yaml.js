function fromObjectWithPrefix(obj, prefix) {
  return Object.keys(obj)
    .map(k => {
      if (typeof obj[k] === 'object') {
        return fromObjectWithPrefix(obj[k], prefix+'  ');
      } else {
        return `${prefix}${k}: ${obj[k]}`;
      }
    })
    .join('\n');
}

export function fromObject(obj) {
  return Object.keys(obj)
    .map(k => {
      if (typeof obj[k] === 'object') {
        return fromObjectWithPrefix(obj[k], '  ');
      } else {
        return `${k}: ${obj[k]}`;
      }
    })
    .join('\n');
}

export function toObject(yaml) {
  let obj = {};
  yaml
    .split('\n')
    .filter(l => l.length>0)
    .join('\n')
    .split(/\n(?=[^ ])/)
  return obj;
}
