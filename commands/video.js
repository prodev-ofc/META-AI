module.exports = { name: "video", alias: [], category: "download", desc: "video", async execute(s,m,a,c){ return require("./yt").execute(s,m,a,c) } }
