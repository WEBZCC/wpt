// This test code is shared between resource-timing-sizes-cache.html and
// resource-timing-sizes-cache-worker.html

if (typeof document === 'undefined') {
    importScripts('/resources/testharness.js',
                  'run-async-tasks-promise.js');
}

// Header size is a fixed constant.
// https://w3c.github.io/resource-timing/#dom-performanceresourcetiming-transfersize
const headerSize = 300;

// The size of this resource must be > maxHeaderSize for the test to be
// reliable.
var url = new URL('/resource-timing/resources/cacheable-and-validated.py?content=loremipsumblablabla', location.href).href;
const bodySize = 19;

function checkBodySizeFields(entry, expectedSize) {
    assert_equals(entry.decodedBodySize, expectedSize, 'decodedBodySize');
    assert_equals(entry.encodedBodySize, expectedSize, 'encodedBodySize');
}

function checkResourceSizes() {
    var entries = performance.getEntriesByName(url);
    assert_equals(entries.length, 3, 'Wrong number of entries');
    var seenCount = 0;
    for (var entry of entries) {
        checkBodySizeFields(entry, bodySize);
        if (seenCount === 0) {
            // 200 response
            assert_equals(entry.transferSize, bodySize + headerSize,
                                     '200 transferSize');
        } else if (seenCount === 1) {
            // from cache
            assert_equals(entry.transferSize, 0, 'cached transferSize');
        } else if (seenCount === 2) {
            // 304 response
            assert_equals(entry.transferSize, headerSize,
                                     '304 transferSize');
        } else {
            assert_unreached('Too many matching entries');
        }
        ++seenCount;
    }
}

promise_test(() => {
    // Use a different URL every time so that the cache behaviour does not
    // depend on execution order.
    url = url + '&unique=' + Math.random().toString().substring(2);
    var eatBody = response => response.arrayBuffer();
    var mustRevalidate = {headers: {'Cache-Control': 'max-age=0'}};
    return fetch(url)
        .then(eatBody)
        .then(() => fetch(url))
        .then(eatBody)
        .then(() => fetch(url, mustRevalidate))
        .then(eatBody)
        .then(runAsyncTasks)
        .then(checkResourceSizes);
}, 'PerformanceResourceTiming sizes caching test');

done();
