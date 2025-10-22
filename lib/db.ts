import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Helper function to execute queries with error handling and timing
export async function executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
  const start = Date.now()
  try {
  // neon client expects tagged template usage; use any cast for dynamic queries
  const result = await (sql as any)(query, params)
    const duration = Date.now() - start
    // Log slow queries (>= 200ms) for investigation
    if (duration >= 200) {
      try {
        // Avoid leaking sensitive data in logs in production
        console.warn(`[db] slow query: ${duration}ms - ${typeof query === 'string' ? query : JSON.stringify(query).slice(0, 200)}`)
      } catch (e) {
        console.warn(`[db] slow query: ${duration}ms`)
      }
    }
    return result as T[]
  } catch (error) {
    const duration = Date.now() - start
    console.error("[v0] Database query error:", { error, duration, query: typeof query === 'string' ? query.slice(0, 300) : undefined })
    throw error
  }
}
