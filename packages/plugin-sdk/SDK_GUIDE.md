# DevFlow Studio — Plugin Developer Guide
## Overview
DevFlow Studio plugins allow you to extend the workflow engine with custom node types and execution logic.

## Creating Your First Plugin

### 1. Folder Structure
```bash
my-plugin/
├── manifest.json
├── index.js
```

### 2. manifest.json
```json
{
  "id": "my.custom.plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "nodes": [
    {
      "type": "customAction",
      "label": "Custom Action",
      "icon": "✨",
      "configSchema": [
        { "key": "msg", "label": "Message", "type": "string", "required": true }
      ]
    }
  ]
}
```

### 3. index.js
```javascript
module.exports = {
  handlers: {
    customAction: async (config, context) => {
      console.log(`Hello from plugin: ${config.msg}`);
      return { success: true };
    }
  }
};
```

## Best Practices
- **Validation**: Use `sdk.validateConfigSchema` to verify inputs.
- **Reporting**: Use `context.nodeId` to emit custom logs via the bridge.
- **Cleanup**: Ensure your handlers don't leak process resources.
