// Force clear require cache and start server
Object.keys(require.cache).forEach(key => delete require.cache[key]);

console.log("🔥🔥🔥 CACHE CLEARED - STARTING FRESH SERVER 🔥🔥🔥");

require("./server");
