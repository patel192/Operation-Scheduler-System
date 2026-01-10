README.md — Operation Scheduler System 
Operation Scheduler System 
Live URL: https://operation-scheduler-a44f8.web.app/ 
A multi-role hospital operations scheduling system built with vanilla HTML, CSS, 
JavaScript, and Firebase. The application streamlines OT (Operation Theatre) scheduling, 
resource management, and coordination between administrators, doctors, OT staff, and 
patients. 
Problem Statement 
Hospitals face operational inefficiencies when scheduling OT rooms, managing doctors, 
patients, equipment, and staff availability using manual or fragmented systems. This 
project provides a centralized web-based solution to manage hospital operations with 
role-based access and real-time updates. 
Key Features 
Multi-role System 
• Admin Dashboard 
• Doctor Dashboard 
• OT Staff Dashboard 
• Patient Dashboard 
Core Modules 
• Authentication (Login, Register, Forgot Password, Email Verification) 
• Role-based Access Control (middleware auth-guard) 
• Department Management 
• Doctor Management 
• Patient Management 
• OT Room Management 
• Equipment Management 
• Scheduling System 
• Schedule Board (visual planner) 
• Alerts and Notifications 
• Insights and Activity Tracking 
Functional Capabilities 
• Create and manage OT schedules 
• Conflict prevention (overlaps, availability) 
• Alerts for upcoming and ongoing schedules 
• Role-specific dashboards 
• Modular JS architecture 
• Firebase Authentication + Firestore backend 
Tech Stack 
• Frontend: HTML5, CSS3, Vanilla JavaScript 
• Backend (BaaS): Firebase 
o Firebase Authentication 
o Firestore Database 
o Firebase Hosting 
• Architecture: Modular ES Modules 
• Deployment: Firebase Hosting 
Project Structure 
project/ 
├── admin/         
├── doctor/        
├── ot/            
├── patient/       
├── components/    
├── middleware/    
├── js/ 
│   ├── admin/ 
│   ├── doctor/ 
│   ├── ot/ 
│   ├── patient/ 
│   ├── layout/ 
│   ├── utils/ 
│   └── firebase.js 
├── index.html 
├── login.html 
└── firebase.json 
   # Admin pages 
   # Doctor pages 
   # OT staff pages 
   # Patient pages 
   # Shared UI components 
   # Auth guards 
Setup Instructions (Local) 
1. Clone the repository 
git clone https://github.com/patel192/Operation-Scheduler-System.git 
2. Open the project folder 
3. Configure Firebase in js/firebase.js 
4. Run locally using Live Server or similar extension 
Deployment 
Deployed using Firebase Hosting: 
firebase login 
firebase init hosting 
firebase deploy 
Status 
This project is functional with core modules implemented. Further enhancements 
(automation, analytics, scalability improvements) are planned as part of ongoing 
development. 
