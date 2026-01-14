# 🧱 Database Schema — Operation Scheduler

## 1. Purpose of This Document

This document defines the **Firestore data model** used in the Operation Scheduler system.

The schema is designed for:
- Consistency
- Safety
- Single source of truth
- Automation compatibility
- Prevention of conflicting data

Firestore is used as the primary backend.

---

## 2. Core Collection: `schedules`

This is the **heart of the system**.  
Each document represents **one surgical operation**.

### Document structure

```json
schedules/{scheduleId}
{
  "startTime": Timestamp,
  "endTime": Timestamp,
  "status": "scheduled | upcoming | ongoing | completed | cancelled",

  "surgeonId": "uid",
  "surgeonName": "string",

  "otRoomId": "string",
  "otRoomName": "string",

  "otStaffIds": ["uid1", "uid2"],

  "equipmentIds": ["eq1", "eq2"],

  "patientId": "string",
  "patientName": "string",

  "procedure": "string",
  "department": "string",

  "notes": [
    { "text": "string", "createdAt": Timestamp }
  ],

  "createdBy": "uid",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
Design decision
There is no separate patients collection.
Patient data exists only inside schedules to avoid duplication.

3. Users Collection: users
Stores authentication metadata and role identity.

json
Copy code
users/{uid}
{
  "fullName": "string",
  "email": "string",
  "role": "admin | doctor | ot",
  "department": "string",
  "createdAt": Timestamp,
  "lastLogin": Timestamp
}
Roles define permissions strictly.

4. OT Rooms: otRooms
json
Copy code
otRooms/{roomId}
{
  "name": "OT-1",
  "department": "Cardiology",
  "status": "available | occupied",
  "createdAt": Timestamp
}
OT room availability is controlled by automation engine.

5. Equipment: equipment
json
Copy code
equipment/{equipmentId}
{
  "name": "Ventilator",
  "category": "Respiratory",
  "description": "High precision ventilator",
  "status": "available | in_use",

  "currentScheduleId": "string | null",
  "currentOtRoomId": "string | null",
  "currentOtRoomName": "string | null",

  "lastUsedAt": Timestamp,
  "departments": ["ICU", "Surgery"]
}
Equipment is locked/unlocked automatically.

6. Alerts: alerts
Alerts are persistent system messages.

json
Copy code
alerts/{alertId}
{
  "userId": "uid",
  "role": "doctor | ot",

  "scheduleId": "string",

  "type": "schedule_created | upcoming | overrun | ...",
  "severity": "info | warning | critical",

  "title": "string",
  "message": "string",

  "read": false,
  "createdAt": Timestamp
}
Alerts are filtered per user and role.

7. Departments: departments
json
Copy code
departments/{deptId}
{
  "name": "Orthopedics",
  "description": "string",
  "createdAt": Timestamp
}
Used to group doctors, rooms, and equipment.

8. Derived State (Not Stored Explicitly)
These are intentionally not stored but computed:

Derived Data	Computed From
Doctor availability	schedules + time
OT room availability	schedules + time
Equipment usage	schedules + time
Patient history	schedules by patientId
Current surgery	status = ongoing

This avoids data inconsistency.

9. Schema Philosophy
The schema follows these principles:

Avoid duplicated data

Avoid conflicting sources of truth

Store intent, not interpretation

Allow automation to infer correctness

Favor computation over redundancy

This makes the system robust and scalable.

10. Summary
The database is:

Clean

Minimal

Automation-friendly

Safe against corruption

Designed like a real operational backend
