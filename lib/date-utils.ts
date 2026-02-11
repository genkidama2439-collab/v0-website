import { format, parseISO } from "date-fns"

/**
 * Get today's date in local 'yyyy-MM-dd' format
 * Avoids UTC timezone issues
 */
export const todayStr = (): string => {
  return format(new Date(), "yyyy-MM-dd")
}

/**
 * Convert a Date object to 'yyyy-MM-dd' string in local timezone
 * Use this instead of toISOString().split("T")[0]
 */
export const dateToYMD = (date: Date): string => {
  return format(date, "yyyy-MM-dd")
}

/**
 * Safely convert 'yyyy-MM-dd' string to Date object in local timezone
 * Creates a Date at local midnight (00:00:00)
 */
export const localDateFromYMD = (ymd: string): Date => {
  return parseISO(`${ymd}T00:00:00`)
}

/**
 * Get a date N days from today in 'yyyy-MM-dd' format
 */
export const daysFromToday = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return dateToYMD(date)
}

/**
 * Get a date N months from today in 'yyyy-MM-dd' format
 */
export const monthsFromToday = (months: number): string => {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return dateToYMD(date)
}
