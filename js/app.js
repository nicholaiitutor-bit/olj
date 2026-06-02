
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
let currentRole = null;
let selectedJobId = null;
let activeChatId = null;

// ================= AUTH UI =================
function openAuth(type) {
  authModal.style.display = "block";

  if (type === "login") {
    authTitle.innerText = "Login";
    registerBtn.style.display = "none";
    loginBtn.style.display = "block";
  } else {
    authTitle.innerText = "Register";
    registerBtn.style.display = "block";
    loginBtn.style.display = "none";
  }
}

function closeAuth() {
  authModal.style.display = "none";
}

// ================= REGISTER =================
function register() {
  const emailVal = email.value;
  const passVal = password.value;
  const roleVal = role.value;

  auth.createUserWithEmailAndPassword(emailVal, passVal)
    .then(userCred => {
      return db.collection("users").doc(userCred.user.uid).set({
        email: emailVal,
        role: roleVal
      });
    });
}

// ================= LOGIN =================
function login() {
  auth.signInWithEmailAndPassword(email.value, password.value);
}

function logout() {
  auth.signOut();
}

// ================= AUTH STATE =================
auth.onAuthStateChanged(async (user) => {

  if (!user) {
    homePage.style.display = "block";
    app.style.display = "none";
    return;
  }

  homePage.style.display = "none";
  app.style.display = "block";

  userEmail.innerText = user.email;

  const doc = await db.collection("users").doc(user.uid).get();
  currentRole = doc.data().role;

  loadJobs();
  loadMyJobs();
});

// ================= NAVIGATION =================
function showView(view) {
  document.querySelectorAll("[id^='view-']").forEach(v => v.style.display = "none");
  document.getElementById("view-" + view).style.display = "block";
}

// ================= JOBS =================
function postJob() {
  const user = auth.currentUser;

  db.collection("jobs").add({
    title: title.value,
    company: company.value,
    salary: salary.value,
    description: description.value,
    ownerId: user.uid,
    createdAt: new Date()
  });
}

function loadJobs() {
  db.collection("jobs").onSnapshot(snap => {
    jobList.innerHTML = "";

    snap.forEach(doc => {
      jobList.innerHTML += `
        <div class="job">
          <h3>${doc.data().title}</h3>
          <button onclick="applyJob('${doc.id}')">Apply</button>
        </div>
      `;
    });
  });
}

// ================= APPLY =================
function applyJob(jobId) {
  selectedJobId = jobId;
  applyBox.style.display = "block";
}

async function submitApplication() {
  const user = auth.currentUser;

  const chatRef = await db.collection("chats").add({
    jobId: selectedJobId,
    participants: {
      applicantId: user.uid,
      employerId: ""
    },
    createdAt: new Date()
  });

  await db.collection("applications").add({
    jobId: selectedJobId,
    applicantId: user.uid,
    chatId: chatRef.id,
    message: applyMessage.value,
    status: "pending"
  });

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
            <button onclick="viewApplicants('${doc.id}')">Applicants</button>
            <div id="apps-${doc.id}"></div>
          </div>
        `;
      });
    });
}

// ================= APPLICANTS =================
function viewApplicants(jobId) {
  const container = document.getElementById("apps-" + jobId);

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

  db.collection("chats")
    .doc(chatId)
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
      senderId: user.uid,
      createdAt: new Date()
    });

  chatInput.value = "";
}
