// Logger utility functions

// Function to log messages with timestamp
export const log = (
  message: string,
  type: 'info' | 'success' | 'error' | 'warning' | 'event' = 'info',
) => {
  const timestamp = new Date().toISOString()
  const time = `\x1b[90m[${timestamp}]\x1b[0m`

  let formattedMessage = message

  switch (type) {
    case 'success':
      console.log(`${time} \x1b[32m✅ ${formattedMessage}\x1b[0m`)
      break
    case 'error':
      console.log(`${time} \x1b[31m❌ ${formattedMessage}\x1b[0m`)
      break
    case 'warning':
      console.log(`${time} \x1b[33m⚠️ ${formattedMessage}\x1b[0m`)
      break
    case 'event':
      console.log(`${time} \x1b[36m🔔 ${formattedMessage}\x1b[0m`)
      break
    case 'info':
    default:
      console.log(`${time} \x1b[94mℹ️ ${formattedMessage}\x1b[0m`)
  }
}

// Specialized log functions for different categories
export const logSuccess = (message: string) => log(message, 'success')
export const logError = (message: string) => log(message, 'error')
export const logWarning = (message: string) => log(message, 'warning')
export const logEvent = (message: string) => log(message, 'event')

// JSON formatter for prettier data logging
export const prettyJSON = (data: any) => {
  try {
    return JSON.stringify(data, null, 2)
      .replace(/{/g, '\x1b[36m{\x1b[0m')
      .replace(/}/g, '\x1b[36m}\x1b[0m')
      .replace(/\[/g, '\x1b[36m[\x1b[0m')
      .replace(/\]/g, '\x1b[36m]\x1b[0m')
      .replace(/"([^"]+)":/g, '\x1b[33m"$1"\x1b[0m:')
  } catch (e) {
    return String(data)
  }
}
