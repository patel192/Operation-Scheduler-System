# 🔄 System Flow — Operation Scheduler

## 1. Purpose of This Document

This document explains **how data and actions flow through the system**.

It focuses on:
- Who performs an action
- What gets stored
- What automation triggers
- How other users see the effect

This clarifies **runtime behavior**, not structure.

---

## 2. High-Level System Flow

The entire system follows this consistent lifecycle:

User Action  
↓  
Firestore Update  
↓  
Automation Engine Evaluates State  
↓  
System Adjusts Data (status, locks, alerts)  
↓  
All dashboards update in real-time  

No role bypasses this flow.

---

## 3. Schedule Creation Flow (Admin / Doctor)

1. Admin or Doctor opens Create Schedule page  
2. Form is submitted  
3. Schedule document created in Firestore  
4. Initial status = `Scheduled`  
5. Equipment and OT rooms are marked as reserved  
6. Alert created:
   - `schedule_created`
   - Sent to relevant doctor and OT staff  
7. Dashboards update automatically

Result:
> Everyone sees the new schedule instantly

---

## 4. Time-based Automation Flow

Handled by:
js/utils/autoUpdateScheduleStatus.js

yaml
Copy code

This process runs periodically and enforces truth.

### Example transitions

| Time Condition | System Action |
|----------------|----------------|
| 30 min before start | Status → Upcoming |
| At start time | Status → Ongoing |
| After end time | Status → Completed |
| Cancelled manually | Status → Cancelled |

Additional effects:
- Locks OT rooms  
- Locks equipment  
- Releases availability when completed  
- Generates alerts  

UI never performs these updates.

---

## 5. Alert Flow

Alerts are generated from two sources:

### Manual events:
- Schedule created
- Schedule updated
- Schedule cancelled

### Automated events:
- Upcoming (T-30 min)
- Ending soon (T-15 min)
- Overrun (time exceeded)

Flow:

Event occurs  
↓  
Alert document created  
↓  
Stored in Firestore  
↓  
Filtered by user role and ID  
↓  
Rendered on dashboard  

Alerts are persistent and do not disappear on refresh.

---

## 6. OT Staff Execution Flow

OT Staff dashboards are optimized for execution, not planning.

Flow:

System updates schedule status  
↓  
OT staff dashboard listens to changes  
↓  
Current surgery highlighted  
↓  
Next surgery displayed  
↓  
Equipment list resolved from IDs  
↓  
No manual mutation possible  

OT staff cannot corrupt system state even accidentally.

---

## 7. Equipment Usage Flow

1. Admin assigns equipment to schedule  
2. Equipment IDs stored inside schedule  
3. Automation engine:
   - Marks equipment as busy during surgery  
   - Releases equipment after completion  
4. OT dashboard resolves equipment IDs → full documents  
5. Equipment availability always reflects reality

---

## 8. Availability Sync Flow

When a schedule becomes:
- Ongoing → doctor unavailable  
- Completed → doctor available again  

Same applies to OT staff.

This ensures:
- No double-booking
- Realistic workload modeling
- Safe scheduling

---

## 9. Failure Prevention by Design

This flow prevents:

- Race conditions  
- Manual status overrides  
- Conflicting updates  
- UI bugs corrupting data  
- OT staff accidentally changing schedules  

All flows return to:

> Firestore → Automation → Firestore → UI

---

## 10. Summary

The system behaves like a real operational engine:

- Users trigger intent  
- System enforces truth  
- UI reflects reality  
- Automation maintains correctness  

This makes the system robust, predictable, and professional-grade.
