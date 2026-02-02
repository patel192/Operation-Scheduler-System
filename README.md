# 🏥 Operation Scheduler System

A web-based hospital operation scheduling and management system built with **HTML, CSS, JavaScript, and Firebase**.  
This project streamlines hospital operations by enabling administrators, doctors, OT staff, and patients to manage schedules, resources, and workflows efficiently.

🔗 **Live Demo:**  
https://operation-scheduler-a44f8.web.app/

---

## 📌 Overview

The **Operation Scheduler System** is designed to solve real-world hospital workflow problems such as:

- Managing operation theatres (OT)
- Scheduling surgeries
- Handling doctor availability
- Managing equipment and departments
- Coordinating between admin, doctors, OT staff, and patients

The application supports **multiple roles** with **separate dashboards** and **role-based access control**.

---

## 🚀 Features

### 👨‍💼 Admin Panel
- Manage departments
- Manage doctors
- Manage OT rooms
- Manage equipment
- Create and manage operation schedules
- View system-wide dashboards
- Approve user registrations
- Monitor hospital resources

### 🧑‍⚕️ Doctor Panel
- View personal schedule
- Daily planner
- Patient list
- Insights dashboard
- OT room availability
- Profile management

### 🧑‍🔧 OT Staff Panel
- View assigned OT rooms
- Alerts for upcoming operations
- Schedule board
- Dashboard

### 🧑‍🤝‍🧑 Patient Panel
- View appointments
- Appointment details
- Reports
- Profile management

### 🔐 Authentication & Security
- Firebase Authentication (login, register, email verification)
- Role-based access control
- Route protection using auth guards

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)

### Backend / Services
- Firebase Authentication
- Firebase Firestore Database
- Firebase Hosting

### Tools
- Firebase CLI
- Git & GitHub

---

## 📂 Project Structure

```plaintext
project/
├── admin/
├── doctor/
├── ot/
├── patient/
├── components/
├── js/
│   ├── admin/
│   ├── doctor/
│   ├── ot/
│   ├── patient/
│   ├── utils/
│   └── firebase.js
├── middleware/
├── public/
├── index.html
├── login.html
├── register.html
└── firebase.json
```

⚙️ Setup Instructions
### 1. Clone the repository
```bash
git clone https://github.com/patel192/Operation-Scheduler-System.git
cd Operation-Scheduler-System
```

### 2. Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### 3. Login to Firebase
```bash
firebase login
```

### 4. Run locally
```bash
firebase serve
```

### 5. Deploy to Firebase Hosting
```bash
firebase deploy
```

## 📸 Screens Implemented

- Login & Register  
- Admin Dashboard  
- Doctor Dashboard  
- OT Dashboard  
- Patient Dashboard  
- Scheduling Board  
- Resource Management Pages  

---

## 📌 Project Status

This project is **actively under development**.

### Planned Improvements
- Advanced analytics dashboards  
- Real-time notifications  
- Performance optimizations  
- UI/UX refinements  
- Audit logs and reporting  

---

## 👨‍💻 Author

**Muhammad Patel**

- **GitHub:** https://github.com/patel192  
- **LinkedIn:** https://www.linkedin.com/in/patel-muhammad-658952355/  
- **Email:** patelmuhammad192@gmail.com  

---

## 📄 License

This project is created for **educational and internship demonstration purposes**.
