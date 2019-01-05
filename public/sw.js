self.addEventListener("push", e => {
  const data = e.data.json();
  self.registration.showNotification(data.title, {
    body: "Sit up straight :) Sent by noSlouch",
    icon: "/images/logo.jpg"
  });
});
