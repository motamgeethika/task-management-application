// Application Configuration & Endpoints
const API_BASE = '/api';

const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

window.AppConfig = {
  API_BASE,
  WS_URL: getWebSocketUrl()
};
