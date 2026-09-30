// Retire the old entry point safely for tabs with cached application code.
// No model runtime, weights, WASM or GPU allocations are loaded here.
self.onmessage=({data})=>self.postMessage({id:data.id,error:'Local AI has been removed to prevent browser memory crashes. Close this tab and reopen Skyvector to use the cloud AI option.'});
