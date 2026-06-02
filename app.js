// ================= FIREBASE CONFIG =================
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

// ================= GLOBAL STATE =================
let selectedJobId = null;
let currentUserRole = null;

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
    })
    .catch(err => alert(err.message));
}

// ================= LOGIN =================
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .catch(err => alert(err.message));
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
    document.getElementById("jobForm").style.display = "none";
    document.getElementById("jobList").innerHTML = "";

    return;
  }

  document.getElementById("authSection").style.display = "none";
  document.getElementById("userSection").style.display = "block";
  document.getElementById("userEmail").innerText = user.email;

  const userDoc = await db.collection("users").doc(user.uid).get();

  currentUserRole = userDoc.exists ? userDoc.data().role : "jobseeker";

  // Show job form only for employers
  if (currentUserRole === "employer") {
    document.getElementById("jobForm").style.display = "block";
  } else {
    document.getElementById("jobForm").style.display = "none";
  }

  loadJobs();
});

// ================= POST JOB =================
function postJob() {
  const user = auth.currentUser;

  const title = document.getElementById("title").value;
  const company = document.getElementById("company").value;
  const salary = document.getElementById("salary").value;
  const description = document.getElementById("description").value;

  if (!title || !company) {
    alert("Please fill required fields");
    return;
  }

  db.collection("jobs").add({
    title,
    company,
    salary,
    description,
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

        let applyButton = "";

        // ONLY jobseekers can apply
        if (currentUserRole === "jobseeker") {
          applyButton = `
            <button onclick="openApply('${doc.id}')">
              Apply
            </button>
          `;
        }

        container.innerHTML += `
          <div class="job">
            <h3>${job.title}</h3>
            <p>${job.company}</p>
            <p>${job.salary}</p>
            <p>${job.description}</p>

            ${applyButton}
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
  const message = document.getElementById("applyMessage").value;

  if (!message) {
    alert("Please write a message");
    return;
  }

  db.collection("applications").add({
    jobId: selectedJobId,
    applicantId: user.uid,
    message,
    createdAt: new Date().toISOString()
  });

  alert("Application sent!");
  document.getElementById("applyBox").style.display = "none";
}
