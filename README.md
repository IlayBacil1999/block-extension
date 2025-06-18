# 🛡️ Website Blocker Extension

A modern Chrome extension that blocks access to specified websites with a beautiful, user-friendly interface.

## ✨ Features

- **Smart Domain Blocking**: Block specific domains and their subdomains automatically
- **Beautiful UI**: Modern, responsive options page with real-time statistics
- **Manifest V3 Compatible**: Uses the latest Chrome extension APIs
- **Real-time Validation**: Instant feedback on domain validity
- **Persistent Storage**: Settings are saved across browser sessions
- **Visual Feedback**: Live preview of currently blocked sites
- **Enhanced Security**: Uses declarativeNetRequest for efficient blocking

## 🚀 Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. Click "Load unpacked" and select the directory containing this extension
4. The extension is now installed and active
5. Click the extension icon to open the options page

## 📖 Usage

### Adding Blocked Sites
1. Click on the extension icon in the toolbar to open the options page
2. Enter the domains you want to block (one per line) in the text area
3. The interface will show real-time validation of your domains
4. Click "Save Changes" to apply the new blocking rules
5. View your currently blocked sites in the right panel

### Managing Blocked Sites
- **Real-time Stats**: See how many sites are blocked and active rules
- **Visual Feedback**: All blocked sites are displayed with status indicators
- **Bulk Operations**: Clear all sites at once or refresh from storage
- **Domain Cleaning**: The extension automatically cleans and validates domains

### Default Blocked Sites
The extension comes pre-configured with these commonly blocked sites:
- facebook.com
- twitter.com
- instagram.com
- reddit.com
- youtube.com
- n12.co.il
- ynet.co.il

## 🔧 Technical Details

### How it Works
This extension uses Chrome's modern `declarativeNetRequest` API to block websites efficiently:

- **Domain-based Blocking**: Uses `requestDomains` for precise domain matching
- **Subdomain Support**: Automatically blocks all subdomains (e.g., `m.facebook.com`)
- **Dynamic Rules**: Rules are generated and updated in real-time
- **Performance Optimized**: Browser-level blocking for minimal performance impact

### Architecture
- **Service Worker**: Background script handles rule management
- **Storage API**: Persistent storage for user preferences
- **Real-time Updates**: Instant rule updates when settings change
- **Error Handling**: Comprehensive error handling and user feedback

### File Structure
```
blocker/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker with blocking logic
├── options.html          # Modern, responsive options page
├── options.js            # Enhanced options page functionality
├── blocked.html          # Beautiful blocked page with actions
├── rules.json            # Static rule template
├── images/               # Extension icons directory
└── README.md            # This file
```

## 🎨 UI Improvements

### Options Page Features
- **Modern Design**: Gradient backgrounds and smooth animations
- **Responsive Layout**: Works perfectly on all screen sizes
- **Real-time Statistics**: Live counters for blocked sites and rules
- **Dual-panel Layout**: Edit and preview sides for better UX
- **Status Indicators**: Color-coded feedback for all actions
- **Enhanced Typography**: Better readability with modern fonts

### Blocked Page Features
- **Animated Design**: Smooth entry animations and pulse effects
- **Quick Actions**: Direct access to settings and navigation
- **Domain Display**: Shows which domain was blocked
- **Professional Styling**: Consistent with the main options page

## 🛠️ Advanced Configuration

### Custom Rules
The extension supports advanced domain patterns:
- Exact domains: `example.com`
- Automatic subdomain blocking: `*.example.com` (handled automatically)
- International domains: Full Unicode support

### Rule Limits
- Maximum dynamic rules: ~5,000 (Chrome limitation)
- Each blocked domain creates 2 rules (domain + subdomains)
- Efficient rule management with automatic cleanup

## 🔒 Privacy & Security

- **No Data Collection**: The extension doesn't track or store personal data
- **Local Storage Only**: All settings stored locally on your device
- **Minimal Permissions**: Only requests necessary permissions
- **Open Source**: All code is transparent and auditable

## 🐛 Troubleshooting

### Common Issues
1. **Extension not loading**: Check if all files are present and manifest.json is valid
2. **Sites not blocking**: Ensure domains are entered correctly without protocols
3. **Rules not updating**: Try the refresh button in options page

### Debug Mode
Check the browser console for detailed error messages and logging information.

## 📋 Requirements

- **Chrome Browser**: Version 88 or higher
- **Manifest V3**: Uses the latest extension standards
- **Modern Features**: Requires ES6+ JavaScript support

## 🤝 Contributing

Feel free to suggest improvements or report issues. The extension is designed to be easily extendable and maintainable.

## 📄 License

This project is open source and available under standard licensing terms.
