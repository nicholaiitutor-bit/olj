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
    document.getElementById("authSection").style.display = "block";
    document.getElementById("userSection").style.display = "none";
    document.getElementById("jobForm").style.display = "none";
    return;
  }

  document.getElementById("authSection").style.display = "none";
  document.getElementById("userSection").style.display = "block";
  document.getElementById("userEmail").innerText = user.email;

  const userDoc = await db.collection("users").doc(user.uid).get();
  const role = userDoc.data().role;

  if (role === "employer") {
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

        container.innerHTML += `
          <div class="job">
            <h3>${job.title}</h3>
            <p>${job.company}</p>
            <p>${job.salary}</p>
            <p>${job.description}</p>

            <button onclick="openApply('${doc.id}')">
              Apply
            </button>
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

  db.collection("applications").add({
    jobId: selectedJobId,
    applicantId: user.uid,
    message,
    createdAt: new Date().toISOString()
  });

  alert("Application sent!");
  document.getElementById("applyBox").style.display = "none";
}
