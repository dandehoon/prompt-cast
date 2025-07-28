# Testing the Extension

## How to Load and Test

1. **Load Extension**:

   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this project folder: `/home/dan/projects/prompt-cast`

2. **Test Focus Issue Fix**:

   - Click on an AI service card (e.g., ChatGPT) when it's disconnected
   - The tab should now open AND focus to that tab
   - Check the console logs to verify the flow

3. **Test Auto-Close Fix**:
   - Enable a service (toggle ON) to open its tab
   - Then disable the service (toggle OFF)
   - The tab should automatically close
   - Check browser console logs for detailed debug info

## Debug Logs to Check

Look for these logs in the browser console (F12 > Console):

- `Service ${serviceId}: wasEnabled=${wasEnabled}, newEnabled=${payload.enabled}, tabId=${service.tabId}`
- `Closing tab ${tabId} for disabled service ${serviceName}`
- `Successfully closed tab for ${serviceName}`

If you see the logs but tabs aren't closing, there might be a Chrome permissions issue.
