# AI Chatbot Frontend - Product Requirements

This document provides the index for all product requirement documents.

## Overview

The AI Chatbot Frontend is a Vue 3-based, layout-independent chatbot component library that supports multiple deployment modes and interaction patterns. It ships as a Vue component or a framework-agnostic iframe, with a full-stack example app (`examples/chatapp`, mock & real LLM backends).

## Features

### Core Features

| Feature | Status | Documentation |
|---------|--------|---------------|
| Chat Interface | Implemented | [Source](../src/components/) |
| Topic Management | Implemented | [Topic Management Guide](./features/session-management.md) |
| Message Streaming (SSE) | Implemented | [Source](../src/composables/useStream.ts) |
| Quick Actions with `{{variable}}` prompts | Implemented | [API](./API.md), [Source](../src/composables/usePromptVariables.ts) |
| Thinking / Chain-of-Thought | Implemented | [API](./API.md) |
| File & Image Preview | Implemented | [Source](../src/components/FilePreviewModal.vue) |
| Theme Toggle | Implemented (hidden by default, host-controlled) | [Source](../src/composables/useUIState.ts) |
| Markdown Rendering | Implemented | [Source](../src/utils/helpers.ts) |
| i18n (zh-CN / en-US) | Implemented | [API](./API.md) |

### Interaction Modes

Interaction mode (how the component is embedded) determines the internal layout automatically:

| Mode | Layout | Description | Status |
|------|--------|-------------|--------|
| Floating | Single | Floating ball that opens a draggable, resizable chat window | Implemented |
| Extended | Dual | Full-page chat application with topic sidebar | Implemented |
| Sidebar | Single | Side panel docked onto the host page | Implemented |

### Topic Management Features

| Feature | Description | Documentation |
|---------|-------------|---------------|
| Create Topics | New topic button | [Topic Management](./features/session-management.md) |
| Switch Topics | Click to select | [Topic Management](./features/session-management.md) |
| Rename Topics | Double-click or context menu | [Topic Management](./features/session-management.md) |
| Delete Topics | Single and batch with confirmation | [Topic Management](./features/session-management.md) |
| Search Topics | Filter with text highlighting | [Topic Management](./features/session-management.md) |

## Documentation

- **API Reference (v2.0):** [`API.md`](./API.md) — configuration interface source of truth
- **High-Level Design:** [`HLD.md`](./HLD.md)
- **Technical Design:** [`TDD.md`](./TDD.md)
- **Design Documents:** [`design/`](./design/)
- **Feature Guides:** [`features/`](./features/)
- **UI Test Guide:** [`../tests/UI_TEST_GUIDE.md`](../tests/UI_TEST_GUIDE.md)

## Changelog

### 2026-09-01
- Open-sourced at https://github.com/dliting/chatbot-front (README mode screenshots, contributing/security docs)
- Quick actions: built-in SVG icon set, send-on-click behavior, `{{variable}}` prompt resolution (`date`/`time`/`datetime`/`weekday` built-ins + custom resolvers), `extraInfo` passthrough
- Renamed Session → Topic terminology across components and composables
- Fixed stale example HTML entries in the vite build config (`npm run build`)

### 2026-06-08
- Added resizable sidebar in extended mode (drag handle, localStorage persistence)
- Added resizable panel width in sidebar mode
- Added floating window corner close button (separate from header actions)
- Hidden theme toggle in all modes (host-controlled via config)
- Fixed image/file preview in historical messages (filename extraction from URL)
- Added markdown image click-to-preview in chat content

### 2026-03-08
- Added topic search with text highlighting
- Added batch selection and deletion
- Added delete confirmation dialogs
- Added context menu (right-click/long-press)
- Added topic title editing
- Added close button for dual layout
- Reorganized documentation (HLD.md, design/, features/)
