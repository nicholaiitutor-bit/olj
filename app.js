
// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyAs5VqodQCgH-F-VYbM1zS2BzsoHOQGpzo",
  authDomain: "remote-work-hub-211d8.firebaseapp.com",
  projectId: "remote-work-hub-211d8",
  storageBucket: "remote-work-hub-211d8.firebasestorage.app",
  messagingSenderId: "697750475671",
  appId: "1:697750475671:web:6e609411ae003e6500aad2"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// ================= STATE =================
let currentUserRole = null;
let selectedJobId = null;

// ================= REGISTER =================
function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCred => {
      return db.collection("users").doc(userCred.user.uid).set({
        email,
        role,
        createdAt: new Date().toISOString()
      });
    });
}

// ================= LOGIN =================
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password);
}

// ================= LOGOUT =================
function logout() {
  auth.signOut();
}

// ================= AUTH STATE =================
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    currentUserRole = null;

    document.getElementById("authSection").style.display = "block";
    document.getElementById("userSection").style.display = "none";
    document.getElementById("employerDashboard").style.display = "none";
    document.getElementById("jobListWrapper").style.display = "none";
    return;
  }

  document.getElementById("authSection").style.display = "none";
  document.getElementById("userSection").style.display = "block";
  document.getElementById("userEmail").innerText = user.email;

  const userDoc = await db.collection("users").doc(user.uid).get();
  currentUserRole = userDoc.data().role;

  if (currentUserRole === "employer") {
    document.getElementById("employerDashboard").style.display = "block";
    document.getElementById("jobListWrapper").style.display = "none";
    loadMyJobs();
  } else {
    document.getElementById("employerDashboard").style.display = "none";
    document.getElementById("jobListWrapper").style.display = "block";
    loadJobs();
  }
});

// ================= TABS =================
function showTab(tab) {
  document.getElementById("tab-dashboard").style.display = "none";
  document.getElementById("tab-jobs").style.display = "none";
  document.getElementById("tab-post").style.display = "none";

  document.getElementById("tab-" + tab).style.display = "block";
}

// ================= POST JOB =================
function postJob() {
  const user = auth.currentUser;

  db.collection("jobs").add({
    title: document.getElementById("title").value,
    company: document.getElementById("company").value,
    salary: document.getElementById("salary").value,
    description: document.getElementById("description").value,
    ownerId: user.uid,
    createdAt: new Date().toISOString()
  });

  alert("Job posted!");
}

// ================= LOAD JOBS =================
function loadJobs() {
  const container = document.getElementById("jobList");

  db.collection("jobs")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const job = doc.data();

        container.innerHTML += `
          <div class="job">
            <h3>${job.title}</h3>
            <p>${job.company}</p>
            <p>${job.salary}</p>
            <p>${job.description}</p>

            <button onclick="openApply('${doc.id}')">Apply</button>
          </div>
        `;
      });
    });
}

// ================= MY JOBS (EMPLOYER) =================
function loadMyJobs() {
  const user = auth.currentUser;
  const container = document.getElementById("myJobs");

  db.collection("jobs")
    .where("ownerId", "==", user.uid)
    .onSnapshot(snapshot => {
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const job = doc.data();
        const jobId = doc.id;

        container.innerHTML += `
          <div class="job">
            <h3>${job.title}</h3>
            <p>${job.company}</p>

            <button onclick="viewApplicants('${jobId}')">
              View Applicants
            </button>

            <div id="apps-${jobId}"></div>
          </div>
        `;
      });
    });
}

// ================= APPLY =================
function openApply(jobId) {
  selectedJobId = jobId;
  document.getElementById("applyBox").style.display = "block";
}

function submitApplication() {
  const user = auth.currentUser;

  db.collection("applications").add({
    jobId: selectedJobId,
    applicantId: user.uid,
    message: document.getElementById("applyMessage").value,
    status: "pending",
    createdAt: new Date().toISOString()
  });

  alert("Applied!");
  document.getElementById("applyBox").style.display = "none";
}

// ================= APPLICANTS SYSTEM =================
function viewApplicants(jobId) {
  const container = document.getElementById("apps-" + jobId);

  db.collection("applications")
    .where("jobId", "==", jobId)
    .onSnapshot(snapshot => {

      container.innerHTML = "";

      snapshot.forEach(doc => {
        const app = doc.data();

        container.innerHTML += `
          <div style="background:#f2f2f2;padding:10px;margin:5px;">
            <p>${app.message}</p>
            <p>Status: ${app.status}</p>

            <button onclick="updateStatus('${doc.id}', 'accepted')">Accept</button>
            <button onclick="updateStatus('${doc.id}', 'rejected')">Reject</button>
          </div>
        `;
      });
    });
}

// ================= ACCEPT / REJECT =================
function updateStatus(appId, status) {
  db.collection("applications").doc(appId).update({
    status: status
  });

  alert("Updated: " + status);
}
