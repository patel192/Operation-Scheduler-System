import {auth,db} from "../firebase.js"
import {collection,addDoc,query,where,getDocs,Timestamp,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const steps = document.querySelectorAll("#form-section");
let currentStep = 0;

const scheduleDraft = {};


function showStep(index){
    steps.forEach((step,i)=>{
        step.style.display = i === index ?"block":"none";
    });
    currentStep = index;
}


showStep(0);

steps[0].querySelector("button").addEventListener("click",()=>{
  const inputs = steps[0].querySelectorAll("input, select, textarea");
  scheduleDraft.patientName = inputs[0].value.trim();
  scheduleDraft.patientId = inputs[1].value.trim();
  scheduleDraft.department = inputs[2].value;
  scheduleDraft.procedure = inputs[3].value.trim();
  scheduleDraft.notes = inputs[4].value.trim();

  if(!scheduleDraft.patientName || !scheduleDraft.procedure){
     alert("Patient name and procedure are required");
     return;
  }
  showStep(1);
});


const step2Btns = steps[1].querySelectorAll("button");
step2Btns[0].addEventListener("click",()=>{showStep(0)});


step2Btns[1].addEventListener("click",()=>{
  const inputs = steps[1].querySelectorAll("input,select");

  scheduleDraft.date = inputs[0].value;
  scheduleDraft.otRoom = inputs[1].value;
  scheduleDraft.duration = inputs[2].value;
  scheduleDraft.startTime = inputs[3].value;
  scheduleDraft.endTime = inputs[4].value;

  if(!scheduleDraft.date||!scheduleDraft.otRoom||!scheduleDraft.startTime||!scheduleDraft.endTime){
   alert("OT room and time are required");
   return;
  }
 showStep(2);
});



const step3Btns = steps[2].querySelectorAll("button");
step3Btns[0].addEventListener("click",()=>{showStep(1)});



step3Btns[1].addEventListener("click",()=>{
  const selects = steps[2].querySelectorAll("select");

  scheduleDraft.surgoen = selects[0].value;
  scheduleDraft.aneshesiologist = selects[1].value;
  scheduleDraft.equipment = [selects[2].value];


  if(!scheduleDraft.surgoen){
    alert("Surgoen selecton is required");
    return;
  }
 const reviewbox = steps[3].querySelector(".bg-slate-50");
 reviewbox.innerHTML = `
 <p><strong>Patient:</strong>${scheduleDraft.patientName}</p>
 <p><strong>Procedure:</strong>${scheduleDraft.procedure}</p>
 <p><strong>OT:</strong>${scheduleDraft.otRoom} | ${scheduleDraft.startTime} - ${scheduleDraft.endTime}</p>
 <p><strong>Doctors:</strong>${scheduleDraft.surgoen} | ${scheduleDraft.aneshesiologist}</p>
 `;
 showStep(3);
});



const step4Btns = steps[3].querySelectorAll("button");
step4Btns[0].addEventListener("click",()=>{showStep(2)});

step4Btns[1].addEventListener("click",async()=>{
try{
 const start = new Date(`${scheduleDraft.date}T${scheduleDraft.startTime}`);
 const end = new Date(`${scheduleDraft.date}T${scheduleDraft.endTime}`);

 const doctorQuery = query(collection(db,"schedules"),
 where("surgoen","==",scheduleDraft.surgoen),
 where("startTime","<",Timestamp.fromDate(end)),
 where("endTime",">",Timestamp.fromDate(start))
);

const doctorSnap = await getDocs(doctorQuery);
if(!doctorSnap.empty){
    alert("Surgoen already has a schedule at this time.");
    return;
}

const otQuery = query(collection(db,"schedules"),
where("otRoom","==",scheduleDraft.otRoom),
where("startTime","<",Timestamp.fromDate(end)),
where("endTime",">",Timestamp.fromDate(start))
);

const otSnap = await getDocs(otQuery);
if(!otSnap.empty){
    alert("OT room is already booked.");
    return;
}

await addDoc(collection(db,"schedules"),{
    ...scheduleDraft,
    startTime:Timestamp.fromDate(start),
    endTime:Timestamp.fromDate(end),
    status:"Scheduled",
    createdBy:auth.currentUser.uid,
    createdAt:serverTimestamp()
});

alert("Schedule created successfully.");
window.location.href = "/admin/schedule-board.html";

}catch(err){
  console.log(err);
  alert("Failed to create schedule.")
}
});