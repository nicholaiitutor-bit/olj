function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCred => {
      const user = userCred.user;

      // Save user profile with role
      db.collection("users").doc(user.uid).set({
        email: user.email,
        role: role,
        createdAt: new Date().toISOString()
      });
    });
}
