// This test code is shared between resource-timing-sizes-redirect.html and
// resource-timing-sizes-redirect-worker.html

if (typeof document === 'undefined') {
  importScripts('/resources/testharness.js',
    '/common/get-host-info.sub.js',
    '/resource-timing/resources/run-async-tasks-promise.js');
}

const baseUrl =
  new URL('/resource-timing/resources/TAOResponse.py?tao=wildcard', location.href).href;
const expectedSize = 4;
const headerSize = 300;

const hostInfo = get_host_info();

var directUrl, sameOriginRedirect, crossOriginRedirect, mixedRedirect;
var complexRedirect;

function checkSizeFields(entry, description) {
  assert_equals(entry.decodedBodySize, expectedSize,
                'decodedBodySize - ' + description);
  assert_equals(entry.encodedBodySize, expectedSize,
                'encodedBodySize - ' + description);
  assert_equals(entry.transferSize, expectedSize + headerSize,
                'transferSize - ' + description);
}

function checkResourceSizes() {
  var entries = performance.getEntriesByType('resource');
  var seenCount = 0;
  for (var entry of entries) {
    switch (entry.name) {
      case directUrl:
        checkSizeFields(entry, "direct");
        ++seenCount;
        break;

      case sameOriginRedirect:
        checkSizeFields(entry, "same origin redirect");
        ++seenCount;
        break;

      case crossOriginRedirect:
      case mixedRedirect:
      case complexRedirect:
        checkSizeFields(entry, "other redirect");
        ++seenCount;
        break;

      default:
        break;
    }
  }
  assert_equals(seenCount, 5, 'seenCount');
}

function redirectUrl(redirectSourceOrigin, allowOrigin, targetUrl) {
  return redirectSourceOrigin +
    '/resource-timing/resources/redirect-cors.py?allow_origin=' +
    encodeURIComponent(allowOrigin) +
    '&timing_allow_origin=*' +
    '&location=' + encodeURIComponent(targetUrl);
}

promise_test(() => {
  // Use a different URL every time so that the cache behaviour does not
  // depend on execution order.
  directUrl = baseUrl + '&unique=' + Math.random().toString().substring(2);
  sameOriginRedirect = redirectUrl(hostInfo.HTTP_ORIGIN, '*', directUrl);
  crossOriginRedirect = redirectUrl(hostInfo.HTTP_REMOTE_ORIGIN,
    hostInfo.HTTP_ORIGIN, directUrl);
  mixedRedirect = redirectUrl(hostInfo.HTTP_REMOTE_ORIGIN,
    hostInfo.HTTP_ORIGIN, sameOriginRedirect);
  complexRedirect = redirectUrl(hostInfo.HTTP_ORIGIN,
    hostInfo.HTTP_REMOTE_ORIGIN, mixedRedirect);
  var eatBody = response => response.arrayBuffer();
  return fetch(directUrl)
    .then(eatBody)
    .then(() => fetch(sameOriginRedirect))
    .then(eatBody)
    .then(() => fetch(crossOriginRedirect))
    .then(eatBody)
    .then(() => fetch(mixedRedirect))
    .then(eatBody)
    .then(() => fetch(complexRedirect))
    .then(eatBody)
    .then(runAsyncTasks)
    .then(checkResourceSizes);
}, 'PerformanceResourceTiming sizes Fetch with redirect test');

done();
