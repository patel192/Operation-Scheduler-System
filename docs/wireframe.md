Wireframe Document — Operation Scheduler System
1. Purpose

The wireframes below show the visual structure and layout of key screens in the Operation Scheduler system.
These are UI skeletons only (no styling details), intended to document how screens are organized and how users interact with them.

Wireframes help reviewers understand:

What elements appear on each page

How different UI components relate

The navigation flow between screens

2. Global Navigation (All Roles)
┌─────────────────────────────────────────────────────┐
| LOGO | Home | Schedules | Alerts | Profile | Logout  |
└─────────────────────────────────────────────────────┘


The navigation bar is role-aware. Some links are removed or disabled based on role.

3. Authentication Screens
3.1 Login Page
┌─────────────────────────────────┐
|          OPERATION SCHEDULER     |
|                                 |
|   [ Email Input ]               |
|   [ Password Input ]            |
|   [ Login Button ]              |
|                                 |
|   Forgot Password?              |
└─────────────────────────────────┘

3.2 Register / Signup (if applicable)
┌─────────────────────────────────┐
|        CREATE ACCOUNT            |
|                                 |
|   [ Full Name ]                 |
|   [ Email ]                     |
|   [ Password ]                  |
|   [ Confirm Password ]          |
|   [ Register Button ]           |
└─────────────────────────────────┘

4. Admin Panel Wireframes
4.1 Admin Dashboard
┌─────────────────────────────────────────────────────────────────┐
| Sidebar:                                                         |
|   Dashboard                                                      |
|   Schedules                                                      |
|   Doctors                                                        |
|   OT Rooms                                                       |
|   Equipment                                                      |
|   Users                                                          |
|                                                                 |
| Main Content:                                                   |
|   ┌─ KPI Cards ──────────────────────────────────────────────┐ |
|   | Total Schedules | Active | Ongoing | Completed | Cancelled| |
|   └─────────────────────────────────────────────────────────────┘ |
|                                                                 |
|   ┌─ Schedule Board (Time Grid with OT lanes) ────────────────┐ |
|   | OT Room 1 | █████  |           | ███  ...                  | |
|   | OT Room 2 |   ███  | ████     |         ...                | |
|   | OT Room 3 |        | ███      | ████   ...                | |
|   └────────────────────────────────────────────────────────────┘ |
└─────────────────────────────────────────────────────────────────┘

4.2 Create Schedule Form
┌─────────────────────────────────────────────────┐
| CREATE SURGERY SCHEDULE                          |
|--------------------------------------------------|
| Doctor: [ Dropdown ]                              |
| OT Room: [ Dropdown ]                             |
| Start Time: [ Date/Time Picker ]                  |
| End Time:   [ Date/Time Picker ]                  |
| Equipment: [ Multi-select dropdown ]              |
| Patient Name: [ Text Input ]                      |
| Procedure:     [ Text Input ]                     |
| Department:    [ Dropdown ]                       |
| Notes:         [ Text Area ]                      |
|                                                  |
| [ Save Schedule ]  [ Cancel ]                    |
└─────────────────────────────────────────────────┘

5. Doctor Panel Wireframes
5.1 Doctor Dashboard
┌─────────────────────────────────────────────────┐
| Alerts (Icon + Count)                            |
|--------------------------------------------------|
| Upcoming Surgeries                               |
| ┌───────────┐ ┌───────────┐ ┌──────────┐          |
| | Surgery # | | Surgery # | | Surgery #|         |
| └───────────┘ └───────────┘ └──────────┘          |
|                                                  |
| Insights/Charts                                  |
| ┌───────────Chart─────────────┐                  |
| | Utilization | Trend | Avg   |                  |
| └─────────────────────────────┘                  |
|                                                  |
| My Schedules                                      |
| [ Table/List View ]                               |
└─────────────────────────────────────────────────┘

5.2 Doctor Alerts
┌─────────────────────────────────────────┐
| ALERTS                                   |
|------------------------------------------|
| [Critical Icon] Surgery starts soon      |
| [Info Icon] Surgery created              |
| [Warning] Overrun detected                |
| ◦ [Mark as read]                          |
└─────────────────────────────────────────┘

6. OT Staff Panel Wireframes
6.1 OT Execution Dashboard
┌─────────────────────────────────────────────────────────┐
| Current Surgery (Focus Panel)                            |
| -------------------------------------------------------- |
| Surgery ID | Surgeon | Start | End | Status              |
| Equipment List | Procedure | Notes | Timers               |
| -------------------------------------------------------- |
| Next Surgery (Preview Panel)                             |
| Surgery Info | Countdown Timer                           |
| -------------------------------------------------------- |
| Alerts (Only actionable)                                 |
└─────────────────────────────────────────────────────────┘


The OT panel is intentionally minimal and operational, not navigational.

7. Equipment Management UI
┌──────────────────────────────────────────────────────┐
| EQUIPMENT LIST                                         |
|--------------------------------------------------------|
| Image | Name | Category | Status | Assigned To | Last |
|--------------------------------------------------------|
| [Edit] [Delete]                                        |
| [Add New Equipment]                                    |
└──────────────────────────────────────────────────────┘

8. Users / Doctors / Admin Table Views
┌──────────────────────────────────────────────────────┐
| USERS (TABLE)                                          |
|--------------------------------------------------------|
| Name | Role | Department | Last Login | Actions         |
|--------------------------------------------------------|
| [Edit] [Delete]                                        |
└──────────────────────────────────────────────────────┘

9. Alerts UI (Common)
┌───────────────────────────────────────────────────┐
| ALERTS DROP-DOWN                                   |
|---------------------------------------------------|
| [Critical] Surgery 09:00 AM - Starting Soon        |
| [Warning] Overrun detected                         |
| [Info] Schedule created                            |
|---------------------------------------------------|
| [Mark all as read]                                 |
└───────────────────────────────────────────────────┘

10. Navigation Flow Summary
AUTHENTICATION
   ↓
ROLE REDIRECTION
   ├ Doctor Dashboard
   ├ OT Staff Dashboard
   └ Admin Dashboard

Doctor
   ├ View My Schedule
   ├ Alerts
   ├ Insights
   └ Profile

OT Staff
   ├ Current Surgery Focus
   ├ Next Surgery
   ├ Alerts
   └ Equipment List

Admin
   ├ Schedule Board
   ├ Create / Edit Schedule
   ├ Equipment Management
   ├ OT Room Management
   ├ Department Management
   └ User Management

11. Wireframe Design Philosophy

The wireframes emphasize:

Clarity over decoration

Actionable items only

Role-specific panels

Real-time updates

Safety and emphasis on automation

OT staff screens are intentionally:

Dense

Execution-focused

Non-navigational

Doctors see:

Planning tools

Alerts

Insights and trends

Admins see:

Control panels

Schedules board

Management tables

12. Summary

These wireframes reflect both:

The functional UI

The real roles and flows

The system behavior

They are suitable for:

Internship submission

Academic documentation

Design review

UI expectation mapping
