import autocannon from "autocannon"
import fs from "fs"
import path from "path"

const target = process.env.LOAD_TEST_URL || "http://localhost:3000"
const endpoint = process.env.LOAD_TEST_ENDPOINT || "/api/auth/me"
const connections = Number(process.env.LOAD_TEST_CONNECTIONS || 50)
const duration = Number(process.env.LOAD_TEST_DURATION || 30)
const pipelining = Number(process.env.LOAD_TEST_PIPELINING || 1)

const url = `${target}${endpoint}`

console.log("Starting load test...")
console.log(`Target: ${url}`)
console.log(`Connections: ${connections}`)
console.log(`Duration: ${duration}s`)

const result = await autocannon({
  url,
  connections,
  duration,
  pipelining,
  headers: {
    "content-type": "application/json",
  },
})

const summary = {
  target: url,
  connections,
  duration,
  requests: {
    average: result.requests.average,
    min: result.requests.min,
    max: result.requests.max,
    p99: result.requests.p99,
  },
  latency: {
    average: result.latency.average,
    min: result.latency.min,
    max: result.latency.max,
    p99: result.latency.p99,
  },
  throughput: {
    average: result.throughput.average,
    min: result.throughput.min,
    max: result.throughput.max,
  },
  errors: result.errors,
  timeouts: result.timeouts,
  non2xx: result.non2xx,
}

const outDir = path.join(process.cwd(), "tests", "load-results")
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, `load-test-${Date.now()}.json`)
fs.writeFileSync(outFile, JSON.stringify(summary, null, 2), "utf-8")

console.log("Load test finished.")
console.log(`Avg req/sec: ${summary.requests.average}`)
console.log(`P99 latency: ${summary.latency.p99} ms`)
console.log(`Errors: ${summary.errors}, Non-2xx: ${summary.non2xx}, Timeouts: ${summary.timeouts}`)
console.log(`Saved result: ${outFile}`)

if (summary.errors > 0 || summary.timeouts > 0) {
  process.exitCode = 1
}
