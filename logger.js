export const levels = { error: 0, warn: 1, info: 2 };

let currentLevel = levels.info;
let silent = false;

function getLevelValue(level) {
  return levels[level] !== undefined ? levels[level] : levels.info;
}

export function setLevel(level) {
  currentLevel = getLevelValue(level);
}

export function setSilent(value) {
  silent = Boolean(value);
}

function shouldLog(level) {
  return !silent && getLevelValue(level) <= currentLevel;
}

function log(method, level, args) {
  if (shouldLog(level) && console && typeof console[method] === 'function') {
    console[method](...args);
  }
}

export const logger = {
  info: (...args) => log('log', 'info', args),
  warn: (...args) => log('warn', 'warn', args),
  error: (...args) => log('error', 'error', args),
  setLevel,
  setSilent
};

export default logger;
