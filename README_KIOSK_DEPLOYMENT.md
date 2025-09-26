# Kiosk Deployment Guide

This guide explains how to deploy the Queue Management System in kiosk mode for hospital waiting areas, reception desks, and public displays.

## Overview

The system supports:
- **Auto-fullscreen mode**: Launches automatically in fullscreen
- **Auto-sound announcements**: Plays chimes and TTS without user interaction
- **Cross-browser compatibility**: Works on Chrome, Edge, Firefox
- **TV/Smart display support**: Optimized for large screens

## Quick Start

### 1. Admin Configuration

1. Navigate to **Settings > General Settings**
2. Enable these toggles:
   - ✅ **Enable Auto-Fullscreen Mode**
   - ✅ **Enable Auto-Sound Announcements**
3. Configure:
   - Hospital branding (name, logo)
   - Announcement templates
   - Display colors and fonts

### 2. Browser Setup

#### Option A: Standard Browser (Recommended)
```bash
# Chrome
chrome --kiosk --start-fullscreen --autoplay-policy=no-user-gesture-required [URL]

# Edge
msedge --kiosk --start-fullscreen --autoplay-policy=no-user-gesture-required [URL]

# Firefox
firefox --kiosk --private-window [URL]
```

#### Option B: Create Desktop Shortcut
1. Right-click desktop → New → Shortcut
2. Use the browser command above with your URL
3. Name it "Reception Display" or "Queue Monitor"

### 3. URL Endpoints

- **Reception Display**: `/public-display/reception`
- **Universal Display**: `/public-display`
- **Department Display**: `/queue-display?department=Consultation`

## Detailed Configuration

### Browser Flags Explained

| Flag | Purpose |
|------|---------|
| `--kiosk` | Full kiosk mode (hides all UI) |
| `--start-fullscreen` | Launch in fullscreen |
| `--autoplay-policy=no-user-gesture-required` | Enable auto-audio |
| `--disable-extensions` | Prevent extensions interference |
| `--disable-web-security` | Allow local resources (if needed) |

### Smart TV / Android Setup

For Android-based smart TVs:
1. Install Chrome or Edge
2. Use TV's kiosk mode or create launcher app
3. Set homepage to your display URL
4. Enable auto-launch on boot

### Windows Kiosk Setup

#### Full Kiosk PC Configuration:
1. Create dedicated Windows user account
2. Set auto-login for that user
3. Add browser shortcut to Startup folder:
   ```
   C:\Users\[User]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\
   ```
4. Configure Windows to prevent task switching

#### Registry Settings (Optional):
```reg
# Disable Alt+Tab
[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Policies\System]
"DisableTaskMgr"=dword:00000001

# Hide taskbar
[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\StuckRects3]
"Settings"=hex:30,00,00,00,fe,ff,ff,ff,03,00,00,00,03,00,00,00...
```

## Troubleshooting

### Audio Not Playing
1. **Check browser autoplay policy**:
   - Chrome: `chrome://settings/content/sound`
   - Edge: `edge://settings/content/sound`
   - Set to "Allow sites to play sound"

2. **Enable in Admin Settings**:
   - Verify "Enable Auto-Sound Announcements" is ON
   - Test with manual announcement

3. **Browser console errors**:
   - Open DevTools (F12)
   - Check for AudioContext errors
   - Look for "autoplay policy" messages

### Fullscreen Not Working
1. **Check browser permissions**:
   - Allow fullscreen for your domain
   - Verify in site settings

2. **Test manually**:
   - Press F11 to test fullscreen
   - Use fullscreen button in display

3. **Browser compatibility**:
   - Some browsers block programmatic fullscreen
   - Use `--kiosk` flag instead

### Display Issues
1. **Check network connection**:
   - Verify WebSocket connectivity
   - Look for "Connection Lost" banners

2. **Clear browser cache**:
   - Hard refresh (Ctrl+F5)
   - Clear site data in browser settings

3. **Screen resolution**:
   - System optimized for 1920x1080 and above
   - Responsive design adapts to smaller screens

### Performance Optimization
1. **Close unnecessary programs**
2. **Disable Windows updates during operating hours**
3. **Use wired internet connection**
4. **Set power settings to never sleep**

## Production Checklist

- [ ] Admin settings configured
- [ ] Auto-fullscreen enabled
- [ ] Auto-sound enabled and tested
- [ ] Browser shortcut created
- [ ] Network connectivity verified
- [ ] Audio output tested
- [ ] Fullscreen functionality confirmed
- [ ] Restart behavior tested
- [ ] Backup display solution prepared

## Support

### Browser Support Matrix
| Browser | Auto-Fullscreen | Auto-Audio | Kiosk Mode | Recommended |
|---------|----------------|------------|------------|-------------|
| Chrome 90+ | ✅ | ✅ | ✅ | ⭐ Primary |
| Edge 90+ | ✅ | ✅ | ✅ | ⭐ Primary |
| Firefox 88+ | ✅ | ⚠️ Limited | ✅ | ✅ Secondary |
| Safari 14+ | ⚠️ Limited | ❌ | ⚠️ Limited | ❌ Not recommended |

### Emergency Procedures
1. **Exit kiosk mode**: Press `Esc` key
2. **Access browser**: `Ctrl+Shift+I` (if not disabled)
3. **Restart browser**: `Alt+F4` → Restart shortcut
4. **System restart**: Standard Windows restart

### Contact Information
- **Technical Support**: [Your IT Department]
- **System Administrator**: [Admin Contact]
- **Emergency Contact**: [Emergency Number]

---

**Version**: 1.0  
**Last Updated**: $(date +'%Y-%m-%d')  
**Compatibility**: Chrome 90+, Edge 90+, Firefox 88+