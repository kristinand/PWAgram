var deferredPrompt;
const ntificationsButtons = document.querySelectorAll(".enable-notifications");

// Check if service workers supported by browser
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => {
      console.log("SW registered");
    })
    .catch((err) => {
      console.log(err);
    });
}

window.addEventListener("beforeinstallprompt", (event) => {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    const options = {
      body: "You successfully subscribet to our service!",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boad.jpg",
      dir: "ltr",
      lang: "en-US",
      vibrate: [100, 50, 200],
      badge: "/src/images/icons/app-icon-96x96.png",
      tag: "confirm-notification",
      renotify: true,
      actions: [
        {
          action: "confirm",
          title: "OK",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
      ],
    };

    navigator.serviceWorker.ready.then((swReg) => {
      swReg.showNotification("Successfully subscribed (from SW)!", options);
    });
  }
}

function askForNotificationPermission() {
  Notification.requestPermission((result) => {
    if (result !== "granted") {
      console.log("No granted permission :(");
    } else {
      displayConfirmNotification();
      // Hide button
    }
  });
}

if ("Notification" in window) {
  ntificationsButtons.forEach((button) => {
    button.style.display = "inline-block";
    button.addEventListener("click", askForNotificationPermission);
  });
}
