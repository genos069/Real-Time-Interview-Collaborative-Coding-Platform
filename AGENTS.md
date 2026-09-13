# Interview AI Platform - Codex Instructions

## Project Overview

This is an AI-powered technical interview platform.

The platform supports:
- Interview creation
- Interview scheduling/management
- Candidate and interviewer roles
- Interview rooms
- Real-time communication
- WebRTC video/audio
- Coding/interview features
- Candidate and interviewer scoring

## Project Structure

The repository contains:
- Backend: Spring Boot
- Database: MongoDB
- Frontend: React
- Real-time communication: WebSocket/STOMP
- Video/audio communication: WebRTC

## General Development Rules

1. Inspect the existing code before making changes.
2. Do not rewrite working features unnecessarily.
3. Prefer small, targeted changes.
4. Preserve existing API contracts unless a change is required.
5. Do not delete existing functionality without explaining why.
6. Keep frontend and backend changes compatible.
7. Reuse existing project patterns and naming conventions.
8. Do not introduce new dependencies unless necessary.
9. Explain the root cause of a bug before making major changes.
10. After making changes, run the relevant tests/build commands.

## Debugging Rules

When fixing a bug:

1. Reproduce or identify the failure.
2. Trace the flow through the existing code.
3. Identify the root cause.
4. Make the smallest reasonable fix.
5. Test the fix.
6. Report:
    - What was wrong
    - What was changed
    - Which files were changed
    - How it was tested

## WebRTC Rules

For WebRTC-related work:

- Do not replace the existing signaling architecture without first inspecting it.
- Clearly distinguish signaling from the WebRTC peer-to-peer connection.
- Track offer, answer, and ICE candidate flow separately.
- Verify interviewer and candidate roles.
- Verify room/session identity.
- Do not assume a WebSocket connection means WebRTC is connected.
- Preserve working WebSocket functionality while debugging WebRTC.

## Git Rules

- Do not reset, delete, or overwrite existing work without explicit approval.
- Keep changes focused on the current task.
- Do not create unnecessary commits.