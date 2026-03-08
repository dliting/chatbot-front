# AI Chatbot Frontend - Product Requirements

This document provides the index for all product requirement documents.

## Overview

The AI Chatbot Frontend is a Vue 3-based, layout-independent chatbot component that supports multiple deployment modes and interaction patterns.

## Features

### Core Features

| Feature | Status | Documentation |
|---------|--------|---------------|
| Chat Interface | Implemented | [Source](../src/components/) |
| Session Management | Implemented | [Session Management Guide](./features/session-management.md) |
| Message Streaming | Implemented | [Source](../src/components/ChatContent.vue) |
| Quick Actions | Implemented | [Source](../src/composables/useQuickActions.ts) |
| Theme Toggle | Implemented | [Source](../src/composables/useTheme.ts) |

### Layout Modes

| Mode | Description | Status |
|------|-------------|--------|
| Floating | Floating ball + popup window | Implemented |
| Extended | Full-screen dual-panel layout | Implemented |
| Sidebar | Collapsible sidebar panel | Implemented |

### Session Management Features

| Feature | Description | Documentation |
|---------|-------------|---------------|
| Create Sessions | New chat button | [Session Management](./features/session-management.md) |
| Switch Sessions | Click to select | [Session Management](./features/session-management.md) |
| Rename Sessions | Double-click or context menu | [Session Management](./features/session-management.md) |
| Delete Sessions | Single and batch with confirmation | [Session Management](./features/session-management.md) |
| Search Sessions | Filter with text highlighting | [Session Management](./features/session-management.md) |

## Documentation

- **High-Level Design:** [`HLD.md`](./HLD.md)
- **Design Documents:** [`design/`](./design/)
- **Feature Guides:** [`features/`](./features/)
- **Implementation Plans:** [`plans/`](./plans/)

## Changelog

### 2026-03-08
- Added session search with text highlighting
- Added batch selection and deletion
- Added delete confirmation dialogs
- Added context menu (right-click/long-press)
- Added session title editing
- Added close button for dual layout
- Reorganized documentation (HLD.md, design/, features/)
