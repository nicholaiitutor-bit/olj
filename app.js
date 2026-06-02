
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
    document.getElementById("employerDashboard").style.display = "none";

    return;
  }

  document.getElementById("authSection").style.display = "none";
  document.getElementById("userSection").style.display = "block";
  document.getElementById("userEmail").innerText = user.email;

  const userDoc = await db.collection("users").doc(user.uid).get();
  currentUserRole = userDoc.data().role;

  if (currentUserRole === "employer") {
    document.getElementById("employerDashboard").style.display = "block";
    loadMyJobs();
  } else {
    document.getElementById("employerDashboard").style.display = "none";
  }

  loadJobs();
});

// ================= TAB SYSTEM =================
function showTab(tab) {
  document.getElementById("tab-dashboard").style.display = "none";
  document.getElementById("tab-jobs").style.display = "none";
  document.getElementById("tab-post").style.display = "none";

  document.getElementById("tab-" + tab).style.display = "block";
}

// ================= POST JOB =================
function postJob() {
  const user = auth.currentUser;

  const title = document.getElementById("title").value;
  const company = document.getElementById("company").value;
  const salary = document.getElementById("salary").value;
  const description = document.getElementById("description").value;

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

// ================= ALL JOBS (JOBSEEKERS VIEW) =================
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
          </div>
        `;
      });
    });
}

// ================= EMPLOYER JOBS =================
function loadMyJobs() {
  const user = auth.currentUser;
  const container = document.getElementById("myJobs");

  db.collection("jobs")
    .where("ownerId", "==", user.uid)
    .onSnapshot(snapshot => {
      container.innerHTML = "";

      snapshot.forEach(doc => {
        const job = doc.data();

        container.innerHTML += `
          <div class="job">
            <h3>${job.title}</h3>
            <p>${job.company}</p>
            <p>${job.salary}</p>
          </div>
        `;
      });
    });
}
