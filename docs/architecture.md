🏥 Operation Scheduler — Project Documentation
1. Project Overview

Operation Scheduler is a production-oriented hospital OT (Operation Theatre) scheduling and execution system built using:

Frontend: Vanilla JavaScript + Tailwind CSS

Backend: Firebase (Authentication + Firestore)

Architecture style: Client-driven with strict system automation

Focus: Safety, role separation, operational correctness

The system manages:

Surgery schedules

OT rooms

Equipment usage

Doctors and OT staff availability

Alerts for critical events

Execution-focused dashboards

2. Core Design Principles

These principles guide the entire system:

Doctors plan

OT Staff executes

System enforces truth

Time-driven automation > UI-driven logic

No page should mutate critical data except authorized flows

Avoid alert fatigue

Patient data derived only from schedules (no separate patient collection)

This architecture reduces:

Human error

Conflicting updates

Data corruption

Operational risk

3. Technology Stack
Layer	Technology
Frontend	HTML, Tailwind CSS, Vanilla JS
Authentication	Firebase Auth
Database	Firebase Firestore
Hosting	Firebase Hosting
Charts	Chart.js (Doctor Insights)
Background Logic	JS automation functions
Deployment Style	Client + Firebase backend
4. Core Data Model
Main Collection: schedules

Each document represents one surgery event.

Fields include:

startTime, endTime

status: Scheduled | Upcoming | Ongoing | Completed | Cancelled

surgeonId, surgeonName

otRoomId, otRoomName

otStaffIds[]

equipmentIds[]

patientId, patientName

procedure

department

notes[]

createdBy, createdAt

❗ There is intentionally no separate patients collection.
Patients exist only through schedules.

5. Roles and Access
👨‍⚕️ Doctor Panel

Planning-focused

Can create and manage schedules

Views:

Dashboard

My Schedule

Insights (utilization, trends)

OT rooms

Alerts

Activity logs

Profile/preferences

Can export data (CSV)

Cannot override system automation improperly

👩‍⚕️ OT Staff Panel

Execution-focused

Fully read-only for planning

Dense, operational UI:

Command-style Dashboard

My Schedule (with live focus panel)

Embedded schedule details (no navigation needed)

Equipment visibility (name, status, category, image)

Alerts

Cannot:

Edit schedules

Change status

Modify equipment

Plan

This prevents accidental corruption.

👨‍💼 Admin Panel

System control

Creates schedules

Manages users, rooms, equipment

Can manually cancel or complete schedules

Sees schedule board (OT lanes)

Triggers automation indirectly

6. Automation Engine (System Truth)
File: autoUpdateScheduleStatus.js

This is the single source of truth for system behavior.

It handles:

Status derivation based on time:

Before start → Upcoming

During → Ongoing

After → Completed

OT room lock/unlock

Equipment lock/unlock

Availability sync (Doctor + OT Staff)

Triggers alert generation (via persistAlerts())

UI pages do not contain automation logic.

7. Alert System
Alert philosophy

Alerts are generated only when action is required, not for informational noise.

Types implemented

| Type | Trigger | Emitted From |
|------|--------|
| schedule_created | Schedule created | Create schedule handler |
| schedule_updated | Schedule edited | Update handler |
| schedule_cancelled | Schedule cancelled | Cancel handler |
| upcoming | T-30 min | Automation engine |
| ending_soon | T-15 min | Automation engine |
| overrun | End exceeded | Automation engine |

Alert schema

Each alert document:

{
  "userId": "uid",
  "role": "doctor | ot",
  "scheduleId": "...",
  "type": "...",
  "severity": "info | warning | critical",
  "title": "...",
  "message": "...",
  "meta": "...",
  "read": false,
  "createdAt": Timestamp
}


Alerts are:

Persisted in Firestore

Filtered per user

Rendered using severity colors

Shared across Doctor and OT staff UI

8. OT Staff UI Highlights
OT Dashboard (dense command center)

Current surgery focus

Next surgery

Countdown timers

Progress bars

Shift context

Operational density

My Schedule (single-screen execution)

Focus panel with full schedule details

Equipment list (resolved from equipment collection)

Notes

Timer bar

Readiness strip

Schedule table for context

No navigation required during execution

This design mirrors real-world OT/ICU style systems.

9. Equipment System

Equipment is stored in equipment collection:

Fields:

name

category

description

status

imageUrl

currentScheduleId

currentOtRoomId

currentOtRoomName

lastUsedAt

departments[]

Schedules store only:

equipmentIds[]

UI resolves IDs → full equipment docs for OT clarity.

10. Safety-Oriented Design Decisions
Decision	Reason
No patients collection	Avoid data duplication & inconsistency
OT staff read-only	Prevent accidental schedule damage
Automation centralization	One source of truth
Alerts only for actionable events	Prevent alert fatigue
Time-based status, not UI-based	Prevent manipulation
Equipment locked by system	Prevent double usage
UI does not run automation	Prevent duplication
11. What Is Complete

Core scheduling system

Firestore schema finalized

Doctor panel functional

OT staff panel fully usable

Automation engine

Alerts system end-to-end

Equipment management

Dense operational UI

CSV exports

Availability sync

12. Planned / Future Enhancements (Optional Roadmap)

These were intentionally deferred:

Advanced OT room lane visualization

Equipment conflict visualization

Drag-and-drop planning

Advanced analytics dashboards

Full audit log system

Cloud Function scheduler instead of client timer

Firestore security hardening (planned last)

13. Project Value

This project demonstrates:

Real-world system architecture

Role-based UX design

Safety-driven constraints

Stateful automation logic

Firebase mastery

Scalable alerting architecture

Clean separation of responsibility

This is not a CRUD app — it is an operational system design.

14. Suggested Resume Description

You can use this directly:

Built a hospital-grade Operation Scheduler system using Firebase, Vanilla JS, and Tailwind. Designed role-based panels for Doctors, OT Staff, and Admin with strict execution vs planning separation. Implemented time-driven automation for schedule status, OT room and equipment locking, availability syncing, and a persistent alerting system. Focused on operational safety, dense UX, and real-world system architecture.