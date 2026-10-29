// meta/movie.js - PRODEV OFC - NO API KEY NEEDED
const fs = require('fs')
const path = require('path')
const yts = require('yt-search')
const axios = require('axios')

const WATERMARK = "> _✨️Meta AI by prodev officials_"

async function searchMovieFree(query) {
  try {
    // YTS free API - works without key
    const { data } = await axios.get(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=1`)
    if (data.data.movies && data.data.movies[0]) {
      return data.data.movies[0]
    }
  } catch {}
  return null
}

async function searchSeriesFree(query) {
  try {
    const { data } = await axios.get(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`)
    if (data[0]) return data[0].show
  } catch {}
  return null
}

module.exports = {
  name: "movie",
  alias: ["film", "series"],
  react: "🎬",
  category: "download",

  async execute(sock, m, args) {
    const jid = m.key.remoteJid
    const fullQuery = args.join(" ")

    if (!fullQuery) {
      return sock.sendMessage(jid, {
        text: `*Example:*\n.movie John Wick\n.movie Avengers\n.series The Boys\n.film Avatar S01 E01\n\n${WATERMARK}`
      }, { quoted: m })
    }

    await sock.sendMessage(jid, { react: { text: "🔍", key: m.key } })

    try {
      const isSeries = fullQuery.toLowerCase().startsWith("series") || /S\d+.*E\d+/i.test(fullQuery)
      let cleanQuery = fullQuery.replace(/series/i, "").replace(/S\d+.*E\d+/i, "").trim()
      
      let movie = null
      let series = null
      let poster = null
      let title = ""
      let year = ""
      let rating = ""

      if (isSeries) {
        series = await searchSeriesFree(cleanQuery)
        if (series) {
          title = series.name
          year = series.premiered ? series.premiered.slice(0,4) : ""
          rating = series.rating?.average || "N/A"
          poster = series.image?.original
        }
      } else {
        movie = await searchMovieFree(cleanQuery)
        if (movie) {
          title = movie.title
          year = movie.year
          rating = movie.rating
          poster = movie.large_cover_image
        }
      }

      // Fallback to YouTube search if YTS fails
      if (!movie && !series) {
        title = cleanQuery
      }

      // Get trailer
      const yt = await yts(title + " official trailer")
      const trailer = yt.videos[0]

      let caption = `*╭┈───〔 🎬 META MOVIE 〕┈───⊷*\n`
      caption += `*├• 🎥 Title:* ${title || cleanQuery}\n`
      if (year) caption += `*├• 📅 Year:* ${year}\n`
      if (rating) caption += `*├• ⭐ Rating:* ${rating}/10\n`
      caption += `*├• 🎭 Type:* ${isSeries ? "Series" : "Movie"}\n`
      if (fullQuery.match(/S\d+.*E\d+/i)) caption += `*├• 📺 Episode:* ${fullQuery.match(/S\d+.*E\d+/i)[0].toUpperCase()}\n`
      caption += `*╰───────────────────⊷*\n\n`
      if (trailer) caption += `*🎬 Trailer:* ${trailer.url}\n\n`
      caption += `${WATERMARK}\n\n_For full movies, place file in /movies folder - bot will send as document (2GB limit)_`

      if (poster) {
        await sock.sendMessage(jid, { image: { url: poster }, caption }, { quoted: m })
      } else {
        await sock.sendMessage(jid, { text: caption }, { quoted: m })
      }

      // AUTO SEND AS DOCUMENT if file exists in /movies/
      const moviesFolder = path.join(__dirname, '..', 'movies')
      if (fs.existsSync(moviesFolder)) {
        const files = fs.readdirSync(moviesFolder)
        const found = files.find(f => f.toLowerCase().includes(cleanQuery.split(" ")[0].toLowerCase()))
        if (found) {
          const filePath = path.join(moviesFolder, found)
          await sock.sendMessage(jid, {
            text: `*_Sending ${found} as document (long video fix)..._*`
          }, { quoted: m })
          
          await sock.sendMessage(jid, {
            document: { url: filePath },
            mimetype: 'video/mp4',
            fileName: found
          }, { quoted: m })
        }
      }

      await sock.sendMessage(jid, { react: { text: "✅", key: m.key } })

    } catch (e) {
      console.log(e)
      await sock.sendMessage(jid, { text: `❌ Error: ${e.message}\n\n${WATERMARK}` }, { quoted: m })
    }
  }
}
