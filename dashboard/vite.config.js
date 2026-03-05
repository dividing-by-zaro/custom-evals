import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const resultsDir = path.resolve(__dirname, '..', 'results')

function resultsPlugin() {
  return {
    name: 'serve-results',
    configureServer(server) {
      server.middlewares.use('/api/results', (req, res, next) => {
        if (req.url === '/' || req.url === '') {
          if (!fs.existsSync(resultsDir)) {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify([]))
            return
          }
          const files = fs.readdirSync(resultsDir)
            .filter(f => f.endsWith('.json'))
          const results = files.map(f => {
            const content = fs.readFileSync(path.join(resultsDir, f), 'utf-8')
            return JSON.parse(content)
          })
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(results))
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), resultsPlugin()],
})
