
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
let activeChatId = null;

// ================= AUTH =================
function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCred => {
      return db.collection("users").doc(userCred.user.uid).set({
        email,
        role
      });
    });
}

function login() {
  auth.signInWithEmailAndPassword(
    document.getElementById("email").value,
    document.getElementById("password").value
  );
}

function logout() {
  auth.signOut();
}

// ================= AUTH STATE =================
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

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

// ================= JOBS =================
function postJob() {
  const user = auth.currentUser;

  db.collection("jobs").add({
    title: title.value,
    company: company.value,
    salary: salary.value,
    description: description.value,
    ownerId: user.uid
  });
}

function loadJobs() {
  jobList.innerHTML = "";

  db.collection("jobs").onSnapshot(snap => {
    jobList.innerHTML = "";

    snap.forEach(doc => {
      const j = doc.data();

      jobList.innerHTML += `
        <div class="job">
          <h3>${j.title}</h3>
          <p>${j.company}</p>
          <button onclick="applyJob('${doc.id}')">Apply</button>
        </div>
      `;
    });
  });
}

// ================= APPLY + CHAT CREATE =================
function applyJob(jobId) {
  selectedJobId = jobId;
  applyBox.style.display = "block";
}

async function submitApplication() {
  const user = auth.currentUser;

  const chatRef = await db.collection("chats").add({
    jobId: selectedJobId,
    participants: {
      employerId: "",
      applicantId: user.uid
    }
  });

  await db.collection("applications").add({
    jobId: selectedJobId,
    applicantId: user.uid,
    chatId: chatRef.id,
    message: applyMessage.value,
    status: "pending"
  });

  alert("Applied");
  applyBox.style.display = "none";
}

// ================= EMPLOYER JOBS =================
function loadMyJobs() {
  const user = auth.currentUser;

  db.collection("jobs")
    .where("ownerId", "==", user.uid)
    .onSnapshot(snap => {
      myJobs.innerHTML = "";

      snap.forEach(doc => {
        myJobs.innerHTML += `
          <div class="job">
            <h3>${doc.data().title}</h3>
            <button onclick="viewApplicants('${doc.id}')">
              View Applicants
            </button>
            <div id="app-${doc.id}"></div>
          </div>
        `;
      });
    });
}

// ================= APPLICANTS =================
function viewApplicants(jobId) {
  const container = document.getElementById("app-" + jobId);

  db.collection("applications")
    .where("jobId", "==", jobId)
    .onSnapshot(snap => {

      container.innerHTML = "";

      snap.forEach(doc => {
        const a = doc.data();

        container.innerHTML += `
          <div>
            <p>${a.message}</p>
            <p>${a.status}</p>

            <button onclick="openChat('${a.chatId}')">Message</button>
            <button onclick="updateStatus('${doc.id}','accepted')">Accept</button>
            <button onclick="updateStatus('${doc.id}','rejected')">Reject</button>
          </div>
        `;
      });
    });
}

// ================= STATUS =================
function updateStatus(id, status) {
  db.collection("applications").doc(id).update({ status });
}

// ================= CHAT =================
function openChat(chatId) {
  activeChatId = chatId;
  chatBox.style.display = "block";

  db.collection("chats").doc(chatId)
    .collection("messages")
    .orderBy("createdAt")
    .onSnapshot(snap => {

      chatMessages.innerHTML = "";

      snap.forEach(doc => {
        chatMessages.innerHTML += `<p>${doc.data().text}</p>`;
      });

    });
}

function sendMessage() {
  const user = auth.currentUser;

  db.collection("chats")
    .doc(activeChatId)
    .collection("messages")
    .add({
      text: chatInput.value,
      sender: user.uid,
      createdAt: new Date().toISOString()
    });

  chatInput.value = "";
}
