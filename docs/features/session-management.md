# Session Management Feature

## Overview

The Session Management feature provides users with the ability to create, view, switch, rename, and delete chat sessions. It includes search functionality, batch operations, and confirmation dialogs for safe data management.

## Features

### 1. Session List

The session list displays all chat sessions with:
- **Session title** - User or auto-generated name
- **Metadata** - Last update time and message count
- **Unread badge** - Shows unread message count
- **Active indicator** - Highlights current session

### 2. Create New Session

Click the "New Chat" button to create a new session. The new session becomes active immediately.

### 3. Switch Sessions

Click on any session in the list to switch to it. The active session is highlighted with a blue left border.

### 4. Search Sessions

Use the search box at the top to filter sessions:
1. Type in the search box
2. Matching text is highlighted in yellow
3. Click the × button to clear search

### 5. Rename Sessions

**Method 1: Double-click**
- Double-click on the session title
- Edit the title in the input field
- Press Enter or click outside to save
- Press Escape to cancel

**Method 2: Right-click menu**
- Right-click on the session
- Select "Rename"
- Edit and save as above

### 6. Delete Sessions

**Single Delete**
1. Click the × icon next to a session (appears on hover)
2. OR right-click and select "Delete"
3. Confirm in the dialog
4. Session is deleted

**Batch Delete**
1. Click the grid icon (bottom-right) to enter batch mode
2. Check the sessions you want to delete
3. Click "Delete selected" in the batch bar
4. Confirm in the dialog
5. All selected sessions are deleted

### 7. Close Panel (Extended Mode)

In Extended mode (dual layout), a close button (×) appears in the top-right of the session panel. Click it to close the panel and return to single view.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close dialog / Cancel editing |
| `Enter` | Save title edit / Confirm dialog |

## Touch Gestures

| Gesture | Action |
|---------|--------|
| Long press | Show context menu (edit/delete) |
| Tap | Select session / Toggle checkbox (batch mode) |

## Developer Integration

### Props

```typescript
interface Props {
  sessions: Session[]              // Required: List of sessions
  currentSessionId: string         // Required: Active session ID
  config?: ChatbotConfig           // Optional: Configuration
  layout?: 'dual' | 'single'       // Optional: Layout mode
  enableClose?: boolean            // Optional: Show close button
  // ... optional label props
}
```

### Events

```typescript
interface Emits {
  (e: 'create-session'): void
  (e: 'select-session', sessionId: string): void
  (e: 'delete-session', sessionId: string): void
  (e: 'delete-sessions', sessionIds: string[]): void
  (e: 'update-session-title', sessionId: string, title: string): void
  (e: 'close'): void
}
```

### Usage Example

```vue
<template>
  <SessionListView
    :sessions="sessions"
    :current-session-id="currentSessionId"
    :layout="'dual'"
    :enable-close="true"
    @create-session="handleCreateSession"
    @select-session="handleSelectSession"
    @delete-session="handleDeleteSession"
    @delete-sessions="handleDeleteSessions"
    @update-session-title="handleUpdateTitle"
    @close="handleClose"
  />
</template>
```

## Accessibility

- All buttons have visible focus states
- Dialogs can be closed with Escape key
- Context menus can be triggered with right-click or long-press
- Form inputs have appropriate labels
- Color contrast meets WCAG AA standards
