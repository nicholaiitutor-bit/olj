// Firebase config (yours)
const firebaseConfig = {
  apiKey: "AIzaSyAs5VqodQCgH-F-VYbM1zS2BzsoHOQGpzo",
  authDomain: "remote-work-hub-211d8.firebaseapp.com",
  projectId: "remote-work-hub-211d8",
  storageBucket: "remote-work-hub-211d8.firebasestorage.app",
  messagingSenderId: "697750475671",
  appId: "1:697750475671:web:6e609411ae003e6500aad2"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Load jobs
function loadJobs() {
  const container = document.getElementById("jobList");
  container.innerHTML = "";

  db.collection("jobs").onSnapshot(snapshot => {
    container.innerHTML = "";

    snapshot.forEach(doc => {
      const job = doc.data();

      container.innerHTML += `
        <div class="job">
          <h3>${job.title}</h3>
          <p><b>Company:</b> ${job.company}</p>
          <p><b>Salary:</b> ${job.salary}</p>
          <p>${job.description}</p>
        </div>
      `;
    });
  });
}

loadJobs();
