export default {
  fetch(request) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.hostname = 'ledgerzero.gabrielaxy.workers.dev';
    return fetch(new Request(url, request));
  },
};
